/**
 * elevenlabs-tts Edge Function
 *
 * Server-side proxy for ElevenLabs text-to-speech. Keeps ELEVENLABS_API_KEY out of the app.
 *
 * Deploy:
 *   npx supabase functions deploy elevenlabs-tts
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Aya's configured ElevenLabs voice. The API key stays private in Supabase secrets.
const DEFAULT_VOICE_ID = 'tpS5zOAgWUiQMhzYbG2h';
const MAX_TEXT_CHARS = 2500;

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
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

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY') || '';
    if (!elevenLabsApiKey) {
      return jsonResponse({ error: 'Missing ElevenLabs Edge Function secret' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_TEXT_CHARS) : '';
    if (!text) {
      return jsonResponse({ error: 'Missing text' }, 400);
    }

    const voiceId = DEFAULT_VOICE_ID;
    const voiceSource = 'hardcoded';
    console.log('ElevenLabs TTS using hardcoded Aya voice');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs request failed:', response.status, errorText.slice(0, 500));
      return jsonResponse({ error: `ElevenLabs request failed: ${response.status}` }, 502);
    }

    const audioBase64 = arrayBufferToBase64(await response.arrayBuffer());
    return jsonResponse({
      audioBase64,
      audioDataUrl: `data:audio/mpeg;base64,${audioBase64}`,
      mimeType: 'audio/mpeg',
      voiceSource,
    });
  } catch (error) {
    console.error('elevenlabs-tts error:', error);
    return jsonResponse({ error: 'Unable to generate speech right now' }, 500);
  }
});
