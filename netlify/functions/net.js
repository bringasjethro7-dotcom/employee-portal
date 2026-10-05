/* JMB Portal — "who is asking?" (Oct 5, 2026)
   Returns the visitor's PUBLIC IP as seen by Netlify's edge, signed with NET_SECRET so the login
   backend (Apps Script, which cannot see IPs itself) can trust it. The signature binds the IP to a
   timestamp; the backend accepts it for 10 minutes. Nothing here is a secret to the visitor — the
   IP is their own and the signature only proves Netlify saw it.

   Netlify → Site configuration → Environment variables → NET_SECRET = <long random string>.
   The SAME value goes into the Script Properties of login-apps-script.gs and portal-apps-script.gs. */
const crypto = require('crypto');

exports.handler = async (event) => {
  const h = event.headers || {};
  const ip = String(h['x-nf-client-connection-ip'] || h['client-ip'] || String(h['x-forwarded-for'] || '').split(',')[0] || '').trim();
  const secret = process.env.NET_SECRET || '';
  const ts = Date.now();
  const sig = secret ? crypto.createHmac('sha256', secret).update(ip + '|' + ts).digest('hex') : '';
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
    body: JSON.stringify({ ok: true, ip: ip, ts: ts, sig: sig, signed: !!secret })
  };
};
