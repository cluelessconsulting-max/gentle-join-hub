const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { email, full_name } = await req.json();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
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
              <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B49A6A;">NEW REGISTRATION</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px 0;text-align:center;">
              <span style="font-size:28px;font-weight:300;color:#0A0A0A;letter-spacing:0.5px;">Hai un nuovo utente registrato</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px 0;">
              <div style="height:1px;background-color:rgba(10,10,10,0.12);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 8px 0;text-align:center;">
              <span style="font-size:13px;color:#0A0A0A;letter-spacing:0.3px;"><strong>Nome:</strong> ${full_name || 'Non specificato'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px 0;text-align:center;">
              <span style="font-size:13px;color:#0A0A0A;letter-spacing:0.3px;"><strong>Email:</strong> ${email || 'Non specificata'}</span>
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
        sender: { name: 'Offlist', email: 'noreply@offlist.network' },
        to: [{ email: 'clueless.consulting@gmail.com', name: 'Admin' }],
        subject: `Nuovo utente registrato — ${full_name || email || 'Offlist'}`,
        htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo error:', JSON.stringify(data));
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
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
