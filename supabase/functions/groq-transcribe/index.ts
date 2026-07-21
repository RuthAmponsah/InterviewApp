/**
 * groq-transcribe Edge Function
 *
 * Server-side proxy for Groq Whisper transcription. Keeps GROQ_API_KEY out of the app.
 *
 * Deploy:
 *   npx supabase functions deploy groq-transcribe
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const decodeBase64 = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorisation header' }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorised' }, 401);
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY') || '';
    if (!groqApiKey) {
      return jsonResponse({ error: 'Missing Groq Edge Function secret' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const base64 = typeof body.base64 === 'string' ? body.base64 : '';
    if (!base64) {
      return jsonResponse({ error: 'Missing audio data' }, 400);
    }

    const audioBytes = decodeBase64(base64);
    if (audioBytes.byteLength > MAX_AUDIO_BYTES) {
      return jsonResponse({ error: 'Audio file is too large' }, 413);
    }

    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'audio/m4a';
    const fileName = typeof body.fileName === 'string' ? body.fileName : 'recording.m4a';
    const formData = new FormData();
    formData.append('file', new Blob([audioBytes], { type: mimeType }), fileName);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.error('Groq transcription failed:', response.status, responseText.slice(0, 500));
      return jsonResponse({ error: `Transcription failed: ${response.status}` }, 502);
    }

    return new Response(responseText, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('groq-transcribe error:', error);
    return jsonResponse({ error: 'Unable to transcribe audio right now' }, 500);
  }
});
