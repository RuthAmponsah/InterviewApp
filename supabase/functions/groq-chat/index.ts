/**
 * groq-chat Edge Function
 *
 * Server-side proxy for Groq chat completions. Keeps GROQ_API_KEY out of the app.
 *
 * Deploy:
 *   npx supabase functions deploy groq-chat
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
]);

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const isValidMessage = (message: unknown) => {
  if (!message || typeof message !== 'object') return false;
  const candidate = message as { role?: unknown; content?: unknown };
  return (
    ['system', 'user', 'assistant'].includes(String(candidate.role)) &&
    typeof candidate.content === 'string' &&
    candidate.content.length <= 120000
  );
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
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length || !messages.every(isValidMessage)) {
      return jsonResponse({ error: 'Invalid messages' }, 400);
    }

    const model = ALLOWED_MODELS.has(String(body.model))
      ? String(body.model)
      : 'llama-3.3-70b-versatile';

    const payload: Record<string, unknown> = {
      messages,
      model,
      temperature: typeof body.temperature === 'number' ? Math.max(0, Math.min(2, body.temperature)) : 0.7,
      max_tokens: typeof body.max_tokens === 'number' ? Math.max(1, Math.min(2500, Math.floor(body.max_tokens))) : 700,
      top_p: typeof body.top_p === 'number' ? Math.max(0, Math.min(1, body.top_p)) : undefined,
      stream: false,
    };

    if (body.response_format && typeof body.response_format === 'object') {
      payload.response_format = body.response_format;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.error('Groq chat failed:', response.status, responseText.slice(0, 500));
      return jsonResponse({ error: `Groq request failed: ${response.status}` }, 502);
    }

    return new Response(responseText, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('groq-chat error:', error);
    return jsonResponse({ error: 'Unable to generate AI response right now' }, 500);
  }
});
