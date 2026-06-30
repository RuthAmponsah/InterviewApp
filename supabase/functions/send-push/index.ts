/**
 * send-push Edge Function
 * Sends a remote push notification to a user via Expo's Push API.
 *
 * Required DB migration before deploying:
 *   ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS push_token text;
 *
 * Deploy: npx supabase functions deploy send-push
 *
 * Call from client:
 *   supabase.functions.invoke('send-push', {
 *     method: 'POST',
 *     body: { userId, title, body, data }
 *   })
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the caller has a valid session
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, title, body, data: payload } = await req.json();
    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'userId, title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the target user's push token using service-role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: prefs, error: prefError } = await supabaseAdmin
      .from('user_preferences')
      .select('push_token')
      .eq('user_id', userId)
      .single();

    if (prefError || !prefs?.push_token) {
      return new Response(
        JSON.stringify({ error: 'No push token found for this user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send via Expo Push API
    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: prefs.push_token,
        title,
        body,
        data: payload ?? {},
        sound: 'default',
        priority: 'high',
      }),
    });

    const result = await expoRes.json();
    console.log('Expo push response:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: expoRes.ok ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-push error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
