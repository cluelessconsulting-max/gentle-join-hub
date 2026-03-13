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
      } catch {
        // Use as-is
      }
    }

    const { action, ...payload } = await req.json();

    // Action: send_email — send to one or more recipients
    if (action === 'send_email') {
      const { recipients, subject, htmlContent, senderName, senderEmail } = payload;

      if (!recipients?.length || !subject || !htmlContent) {
        return new Response(JSON.stringify({ error: 'recipients, subject and htmlContent are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName || 'Offlist', email: senderEmail || 'info@herclueless.co.uk' },
          to: recipients.map((r: { email: string; name?: string }) => ({
            email: r.email,
            name: r.name || r.email,
          })),
          subject,
          htmlContent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Brevo send email error:', JSON.stringify(data));
        return new Response(JSON.stringify({ success: false, error: data }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: sync_contact — create/update contact in Brevo
    if (action === 'sync_contact') {
      const { email, attributes } = payload;

      if (!email) {
        return new Response(JSON.stringify({ error: 'email is required' }), {
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
          attributes: attributes || {},
          updateEnabled: true,
        }),
      });

      const data = await response.json();
      if (!response.ok && response.status !== 204) {
        console.error('Brevo sync error:', JSON.stringify(data));
        return new Response(JSON.stringify({ success: false, error: data }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: create_attributes — create missing contact attributes
    if (action === 'create_attributes') {
      const attributes = [
        { name: 'CITY', type: 'text' },
        { name: 'AGE', type: 'text' },
        { name: 'INSTAGRAM', type: 'text' },
        { name: 'TIKTOK', type: 'text' },
        { name: 'INTERESTS', type: 'text' },
        { name: 'SHOPPING_STYLE', type: 'text' },
        { name: 'EVENT_FREQUENCY', type: 'text' },
        { name: 'REFERRAL', type: 'text' },
        { name: 'HOW_HEARD', type: 'text' },
        { name: 'STATUS', type: 'text' },
        { name: 'JOB_TITLE', type: 'text' },
        { name: 'INDUSTRY', type: 'text' },
        { name: 'TRAVEL_STYLE', type: 'text' },
        { name: 'IDEAL_NIGHT_OUT', type: 'text' },
        { name: 'FAVOURITE_NEIGHBOURHOODS', type: 'text' },
      ];

      const results = [];
      for (const attr of attributes) {
        try {
          const res = await fetch(`https://api.brevo.com/v3/contacts/attributes/normal/${attr.name}`, {
            method: 'POST',
            headers: {
              'api-key': BREVO_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: attr.type }),
          });
          const ok = res.ok || res.status === 400; // 400 = already exists
          const detail = res.ok ? 'created' : (await res.text());
          results.push({ name: attr.name, ok, detail });
        } catch (e) {
          results.push({ name: attr.name, ok: false, detail: e.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: get_stats — get Brevo account info
    if (action === 'get_stats') {
      const response = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': BREVO_API_KEY },
      });
      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: get_senders — check sender/domain configuration
    if (action === 'get_senders') {
      const response = await fetch('https://api.brevo.com/v3/senders', {
        headers: {
          'api-key': BREVO_API_KEY,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: get_email_events — inspect delivery/bounce/block events
    if (action === 'get_email_events') {
      const { email, limit = 20, days = 7 } = payload;
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      params.set('limit', String(limit));
      params.set('days', String(days));

      const response = await fetch(`https://api.brevo.com/v3/smtp/statistics/events?${params.toString()}`, {
        headers: {
          'api-key': BREVO_API_KEY,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      return new Response(JSON.stringify({ success: response.ok, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Brevo admin error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
