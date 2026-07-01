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

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getExistingPacks = async (supabaseAdmin: any, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('user_preferences')
    .select('user_id,purchased_packs')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return {
    rowExists: Boolean(data),
    packs: Array.isArray(data?.purchased_packs) ? data.purchased_packs as string[] : [],
  };
};

const savePacks = async (
  supabaseAdmin: any,
  userId: string,
  rowExists: boolean,
  packs: string[],
) => {
  const { error } = rowExists
    ? await supabaseAdmin
        .from('user_preferences')
        .update({ purchased_packs: packs })
        .eq('user_id', userId)
    : await supabaseAdmin
        .from('user_preferences')
        .insert({ user_id: userId, purchased_packs: packs });

  if (error) throw error;
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
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const revenueCatSecretKey = Deno.env.get('REVENUECAT_SECRET_API_KEY') || '';
    if (!revenueCatSecretKey) {
      return jsonResponse({ error: 'Missing RevenueCat secret API key' }, 500);
    }

    const revenueCatResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,
      {
        headers: {
          Authorization: `Bearer ${revenueCatSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!revenueCatResponse.ok) {
      const body = await revenueCatResponse.text();
      console.error('RevenueCat subscriber lookup failed:', revenueCatResponse.status, body);
      return jsonResponse({ error: 'Could not verify purchases with RevenueCat' }, 502);
    }

    const revenueCatData = await revenueCatResponse.json();
    const nonSubscriptions = revenueCatData?.subscriber?.non_subscriptions || {};
    const verifiedPackIds = new Set<string>();

    for (const [productId, purchases] of Object.entries(nonSubscriptions)) {
      const packId = productToPackId[productId];
      if (packId && Array.isArray(purchases) && purchases.length > 0) {
        verifiedPackIds.add(packId);
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const existing = await getExistingPacks(supabaseAdmin, user.id);
    const nextPacks = Array.from(new Set([...existing.packs, ...verifiedPackIds]));
    await savePacks(supabaseAdmin, user.id, existing.rowExists, nextPacks);

    return jsonResponse({ purchasedPacks: nextPacks, verifiedCount: verifiedPackIds.size });
  } catch (error) {
    console.error('sync-sector-packs error:', error);
    return jsonResponse({ error: String(error) }, 500);
  }
});
