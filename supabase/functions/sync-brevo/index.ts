const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    if (!BREVO_API_KEY.startsWith('xkeysib-')) {
      try {
        const decoded = atob(BREVO_API_KEY);
        const parsed = JSON.parse(decoded);
        BREVO_API_KEY = parsed.api_key || BREVO_API_KEY;
      } catch { /* use as-is */ }
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const attributes: Record<string, string> = {
      FULL_NAME:                body.fullName || body.full_name || '',
      NOME:                     body.firstName || '',
      COGNOME:                  body.lastName || '',
      AGE:                      body.age || '',
      INSTAGRAM:                body.instagram || '',
      TIKTOK:                   body.tiktok || '',
      PHONE:                    body.phone || '',
      CITY:                     body.city || '',
      INTERESTS:                body.interests || '',
      SHOPPING_STYLE:           body.shoppingStyle || '',
      EVENT_FREQUENCY:          body.eventFrequency || '',
      REFERRAL:                 body.referral || '',
      HOW_HEARD:                body.howHeard || '',
      APPLICATION_STATUS:       body.applicationStatus || '',
      JOB_TITLE:                body.jobTitle || '',
      INDUSTRY:                 body.industry || '',
      TRAVEL_STYLE:             body.travelStyle || '',
      IDEAL_NIGHT_OUT:          body.idealNightOut || '',
      FAVOURITE_NEIGHBOURHOODS: body.favouriteNeighbourhoods || '',
      INVITE_CODE:              body.inviteCode || '',
      REFERRAL_CODE:            body.referralCode || '',
      REFERRED_BY:              body.referredBy || '',
      BUYER_TIER:               body.buyerTier || '',
      TOTAL_POINTS:             body.totalPoints || '',
    };

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes,
        updateEnabled: true,
      }),
    });

    const data = await response.json();

    if (!response.ok && response.status !== 204) {
      console.error('Brevo API error:', JSON.stringify(data));
      return new Response(JSON.stringify({ success: false, error: data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error syncing to Brevo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
