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
    
    // Handle base64-encoded JSON format
    if (!BREVO_API_KEY.startsWith('xkeysib-')) {
      try {
        const decoded = atob(BREVO_API_KEY);
        const parsed = JSON.parse(decoded);
        BREVO_API_KEY = parsed.api_key || BREVO_API_KEY;
      } catch {
        // Use as-is if decoding fails
      }
    }

    const { email, firstName, lastName, city, age, instagram, tiktok, phone, interests, shoppingStyle, eventFrequency, referral, howHeard } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes: {
          NOME: firstName || '',
          COGNOME: lastName || '',
          CITY: city || '',
          AGE: age || '',
          INSTAGRAM: instagram || '',
          TIKTOK: tiktok || '',
          SMS: phone || '',
          INTERESTS: interests || '',
          SHOPPING_STYLE: shoppingStyle || '',
          EVENT_FREQUENCY: eventFrequency || '',
          REFERRAL: referral || '',
          HOW_HEARD: howHeard || '',
        },
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
