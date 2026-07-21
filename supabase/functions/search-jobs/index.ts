/**
 * search-jobs Edge Function
 *
 * Keeps Adzuna credentials server-side. The app sends search parameters,
 * this function adds ADZUNA_APP_ID / ADZUNA_APP_KEY and returns Adzuna results.
 *
 * Deploy:
 *   npx supabase functions deploy search-jobs
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/gb/search';
const RETRYABLE_STATUS_CODES = [502, 503, 504];
const MAX_RESULTS_PER_PAGE = 50;

type SearchJobsBody = {
  page?: number;
  resultsPerPage?: number;
  keywords?: string;
  location?: string;
  categoryTag?: string;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const asSafeText = (value: unknown, fallback = '') => {
  if (typeof value !== 'string') return fallback;
  return value.trim().replace(/\s+/g, ' ').slice(0, 120);
};

const asPositiveInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
};

const fetchWithRetry = async (url: string) => {
  const response = await fetch(url);

  if (RETRYABLE_STATUS_CODES.includes(response.status)) {
    await delay(700);
    return fetch(url);
  }

  return response;
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

    const adzunaAppId = Deno.env.get('ADZUNA_APP_ID') || '';
    const adzunaAppKey = Deno.env.get('ADZUNA_APP_KEY') || '';
    if (!adzunaAppId || !adzunaAppKey) {
      return jsonResponse({ error: 'Missing Adzuna Edge Function secrets' }, 500);
    }

    const body = await req.json().catch(() => ({})) as SearchJobsBody;
    const page = asPositiveInt(body.page, 1, 100);
    const resultsPerPage = asPositiveInt(body.resultsPerPage, 20, MAX_RESULTS_PER_PAGE);
    const keywords = asSafeText(body.keywords);
    const location = asSafeText(body.location, 'uk') || 'uk';
    const categoryTag = asSafeText(body.categoryTag);

    const params = new URLSearchParams({
      app_id: adzunaAppId,
      app_key: adzunaAppKey,
      results_per_page: resultsPerPage.toString(),
      what: keywords,
      where: location,
    });

    if (categoryTag) {
      params.append('category', categoryTag);
    }

    const response = await fetchWithRetry(`${BASE_URL}/${page}?${params.toString()}`);
    const responseText = await response.text();

    if (!response.ok) {
      console.error('Adzuna request failed:', response.status, responseText.slice(0, 500));
      if (response.status === 401) {
        return jsonResponse({ error: 'Adzuna authorisation failed' }, 502);
      }
      if (RETRYABLE_STATUS_CODES.includes(response.status)) {
        return jsonResponse({ error: 'Adzuna is temporarily unavailable. Please try again in a moment.' }, 503);
      }
      return jsonResponse({ error: `Adzuna API error: ${response.status}` }, 502);
    }

    return new Response(responseText, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('search-jobs error:', error);
    return jsonResponse({ error: 'Unable to search jobs right now' }, 500);
  }
});
