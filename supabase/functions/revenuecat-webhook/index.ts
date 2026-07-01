import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const productToPackId: Record<string, string> = {
  myinterview_nhs_care_v2: 'nhs-care',
  myinterview_graduate_v2: 'graduate',
  myinterview_retail_v2: 'retail',
  myinterview_management_v2: 'management',
};

const purchaseEventTypes = new Set([
  'NON_RENEWING_PURCHASE',
  'INITIAL_PURCHASE',
]);

const normaliseAuthToken = (value: string | null) =>
  (value || '').replace(/^Bearer\s+/i, '').trim();

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const addPackToUser = async (supabaseAdmin: any, userId: string, packId: string) => {
  const { data: prefs, error: selectError } = await supabaseAdmin
    .from('user_preferences')
    .select('user_id,purchased_packs')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) throw selectError;

  const currentPacks: string[] = Array.isArray(prefs?.purchased_packs)
    ? prefs.purchased_packs
    : [];
  const nextPacks = currentPacks.includes(packId)
    ? currentPacks
    : [...currentPacks, packId];

  const { error } = prefs
    ? await supabaseAdmin
        .from('user_preferences')
        .update({ purchased_packs: nextPacks })
        .eq('user_id', userId)
    : await supabaseAdmin
        .from('user_preferences')
        .insert({ user_id: userId, purchased_packs: nextPacks });

  if (error) throw error;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const expectedToken = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_TOKEN') || '';
  if (expectedToken) {
    const providedToken = normaliseAuthToken(req.headers.get('authorization'));
    if (providedToken !== expectedToken) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  } else {
    console.warn('REVENUECAT_WEBHOOK_AUTH_TOKEN is not set; webhook is not protected.');
  }

  try {
    const payload = await req.json();
    const event = payload?.event;
    if (!event) {
      return jsonResponse({ error: 'Missing RevenueCat event' }, 400);
    }

    const eventId = String(event.id || event.event_id || event.transaction_id || crypto.randomUUID());
    const eventType = String(event.type || '');
    const appUserId = String(event.app_user_id || '');
    const productId = String(event.product_id || '');
    const transactionId = event.transaction_id ? String(event.transaction_id) : null;
    const packId = productToPackId[productId];

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    await supabaseAdmin
      .from('revenuecat_webhook_events')
      .upsert({
        event_id: eventId,
        event_type: eventType || 'UNKNOWN',
        app_user_id: appUserId || null,
        product_id: productId || null,
        transaction_id: transactionId,
        payload,
      }, { onConflict: 'event_id' });

    if (!purchaseEventTypes.has(eventType) || !packId) {
      return jsonResponse({ received: true, ignored: true });
    }

    if (!appUserId) {
      return jsonResponse({ error: 'Missing app_user_id for sector pack purchase' }, 400);
    }

    await addPackToUser(supabaseAdmin, appUserId, packId);

    return jsonResponse({ received: true, unlockedPack: packId });
  } catch (error) {
    console.error('RevenueCat webhook error:', error);
    return jsonResponse({ error: String(error) }, 500);
  }
});
