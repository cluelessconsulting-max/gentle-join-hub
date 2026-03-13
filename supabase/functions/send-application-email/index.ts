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
    if (!BREVO_API_KEY) throw new Error('BREVO_API_KEY is not configured');

    if (!BREVO_API_KEY.startsWith('xkeysib-')) {
      try {
        const decoded = atob(BREVO_API_KEY);
        const parsed = JSON.parse(decoded);
        BREVO_API_KEY = parsed.api_key || BREVO_API_KEY;
      } catch { /* use as-is */ }
    }

    const { email, firstName, skipped } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const completeHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#EDE8E0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EDE8E0;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#EDE8E0;">
        <tr><td style="padding:0 0 32px 0;text-align:center;">
          <span style="font-size:18px;letter-spacing:4px;text-transform:uppercase;color:#0A0A0A;font-weight:400;">OFFLIST</span>
        </td></tr>
        <tr><td style="padding:0 0 10px 0;text-align:center;">
          <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B49A6A;">APPLICATION RECEIVED</span>
        </td></tr>
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <span style="font-size:28px;font-weight:300;color:#0A0A0A;letter-spacing:0.5px;">Your application has been submitted.</span>
        </td></tr>
        <tr><td style="padding:0 0 24px 0;"><div style="height:1px;background-color:rgba(10,10,10,0.12);"></div></td></tr>
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <span style="font-size:13px;color:#8B8178;letter-spacing:0.3px;line-height:1.8;">
            Hi \${firstName || 'there'},<br><br>
            You will be notified about the status of your application.<br><br>
            In the meantime, follow us on social media:
          </span>
        </td></tr>
        <tr><td style="padding:0 0 12px 0;text-align:center;">
          <a href="https://www.instagram.com/offlist.network/" style="display:inline-block;background-color:#0A0A0A;color:#EDE8E0;text-decoration:none;padding:10px 24px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0 6px;">Instagram</a>
          <a href="https://www.tiktok.com/@off.list.network" style="display:inline-block;background-color:#0A0A0A;color:#EDE8E0;text-decoration:none;padding:10px 24px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0 6px;">TikTok</a>
        </td></tr>
        <tr><td style="padding:24px 0 0 0;"><div style="height:1px;background-color:rgba(10,10,10,0.12);"></div></td></tr>
        <tr><td style="padding:24px 0 0 0;text-align:center;">
          <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#8B8178;">OFFLIST NETWORK</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const skippedHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#EDE8E0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EDE8E0;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#EDE8E0;">
        <tr><td style="padding:0 0 32px 0;text-align:center;">
          <span style="font-size:18px;letter-spacing:4px;text-transform:uppercase;color:#0A0A0A;font-weight:400;">OFFLIST</span>
        </td></tr>
        <tr><td style="padding:0 0 10px 0;text-align:center;">
          <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B49A6A;">APPLICATION RECEIVED</span>
        </td></tr>
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <span style="font-size:28px;font-weight:300;color:#0A0A0A;letter-spacing:0.5px;">Your application has been submitted.</span>
        </td></tr>
        <tr><td style="padding:0 0 24px 0;"><div style="height:1px;background-color:rgba(10,10,10,0.12);"></div></td></tr>
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <span style="font-size:13px;color:#8B8178;letter-spacing:0.3px;line-height:1.8;">
            Hi \${firstName || 'there'},<br><br>
            You will be notified about the status of your application.<br><br>
            In the meantime, follow us on social media:
          </span>
        </td></tr>
        <tr><td style="padding:0 0 12px 0;text-align:center;">
          <a href="https://www.instagram.com/offlist.network/" style="display:inline-block;background-color:#0A0A0A;color:#EDE8E0;text-decoration:none;padding:10px 24px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0 6px;">Instagram</a>
          <a href="https://www.tiktok.com/@off.list.network" style="display:inline-block;background-color:#0A0A0A;color:#EDE8E0;text-decoration:none;padding:10px 24px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0 6px;">TikTok</a>
        </td></tr>
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <span style="font-size:13px;color:#8B8178;letter-spacing:0.3px;line-height:1.8;">
            <br><span style="color:#0A0A0A;font-style:italic;">Tell us more about yourself so we can tailor our events to your interests.</span>
          </span>
        </td></tr>
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <a href="https://gentle-join-hub.lovable.app/dashboard" style="display:inline-block;background-color:#0A0A0A;color:#EDE8E0;text-decoration:none;padding:14px 36px;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Complete Your Profile</a>
        </td></tr>
        <tr><td style="padding:24px 0 0 0;"><div style="height:1px;background-color:rgba(10,10,10,0.12);"></div></td></tr>
        <tr><td style="padding:24px 0 0 0;text-align:center;">
          <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#8B8178;">OFFLIST NETWORK</span>
        </td></tr>
      </table>
    </td></tr>
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
        sender: { name: 'Offlist', email: 'clueless.consulting@gmail.com' },
        to: [{ email, name: firstName || '' }],
        subject: 'Your application has been received — Offlist',
        htmlContent: skipped ? skippedHtml : completeHtml,
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
