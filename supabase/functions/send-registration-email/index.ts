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

    const { email, firstName, eventName, eventDate, eventLocation, status } = await req.json();

    if (!email || !eventName) {
      return new Response(JSON.stringify({ error: 'email and eventName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isWaitlist = status === 'waitlist';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#EDE8E0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EDE8E0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#EDE8E0;">
          <tr>
            <td style="padding:0 0 32px 0;text-align:center;">
              <span style="font-size:18px;letter-spacing:4px;text-transform:uppercase;color:#0A0A0A;font-weight:400;">OFFLIST</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 10px 0;text-align:center;">
              <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B49A6A;">
                ${isWaitlist ? 'WAITLIST CONFIRMATION' : 'APPLICATION RECEIVED'}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px 0;text-align:center;">
              <span style="font-size:28px;font-weight:300;color:#0A0A0A;letter-spacing:0.5px;">
                ${isWaitlist ? 'You\\'re on the waitlist.' : 'Your application has been submitted.'}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 8px 0;text-align:center;">
              <span style="font-size:13px;color:#8B8178;letter-spacing:0.5px;">${eventName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 32px 0;text-align:center;">
              <span style="font-size:11px;color:#8B8178;letter-spacing:0.5px;">${eventDate || ''}${eventLocation ? ' · ' + eventLocation : ''}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px 0;">
              <div style="height:1px;background-color:rgba(10,10,10,0.12);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px 0;text-align:center;">
              <span style="font-size:13px;color:#8B8178;letter-spacing:0.3px;line-height:1.8;">
                ${isWaitlist
                  ? 'The event is currently full. We\\'ll notify you if a spot opens up.'
                  : 'We will be in touch with updates on the progress of your application.'}
              </span>
            </td>
          </tr>
          ${!isWaitlist ? \`
          <tr>
            <td style="padding:0 0 24px 0;text-align:center;">
              <span style="font-size:12px;color:#0A0A0A;letter-spacing:0.3px;font-style:italic;">
                No tickets are required if you come with Offlist.
              </span>
            </td>
          </tr>
          \` : ''}
          <tr>
            <td style="padding:0 0 12px 0;">
              <div style="height:1px;background-color:rgba(10,10,10,0.12);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 32px 0;text-align:center;">
              <span style="font-size:18px;color:#0A0A0A;letter-spacing:0.5px;line-height:2;">
                Don't forget to follow us on<br>
                <a href="https://www.instagram.com/offlist.network/" style="color:#0A0A0A;text-decoration:underline;font-weight:500;">Instagram</a>
                &amp;
                <a href="https://www.tiktok.com/@off.list.network" style="color:#0A0A0A;text-decoration:underline;font-weight:500;">TikTok</a><br>
                to stay updated with the latest events.
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 0 0;">
              <div style="height:1px;background-color:rgba(10,10,10,0.12);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 0 0;text-align:center;">
              <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#8B8178;">OFFLIST NETWORK</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Offlist', email: 'info@herclueless.co.uk' },
        to: [{ email, name: firstName || '' }],
        subject: 'Offlist - Event updates',
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

    // Also add event as tag on the contact
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes: {
          LAST_EVENT: eventName,
        },
        listIds: [],
        updateEnabled: true,
      }),
    });

    return new Response(JSON.stringify({ success: true, providerResponse: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error sending registration email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
