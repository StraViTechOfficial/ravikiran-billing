// Private-link gate for the prototype.
// Env vars (Vercel → Settings → Environment Variables):
//   ACCESS_KEYS   = "ravi:k7f3x9q2,demo:p4m8w1z6"   label:key pairs, comma separated
//   PREVIEW_UNTIL = "2026-11-15"                      optional; after this date the link stops working
// Share  https://ravikiran.stravitech.com/?k=<key>  — the key is swapped for a cookie and the URL is cleaned.
// Every visit is logged (label, city, device) in Vercel → Logs.
import { next } from '@vercel/functions';

export const config = { runtime: 'nodejs' };

const COOKIE = 'rk_access';
const MAX_AGE = 60 * 60 * 24 * 30;

function keys() {
  const map = new Map();
  for (const pair of (process.env.ACCESS_KEYS || '').split(',')) {
    const [label, key] = pair.split(':').map(s => s && s.trim());
    if (label && key && key.length >= 6) map.set(key, label);
  }
  return map;
}

function cookie(request, name) {
  const m = (request.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}

function log(request, label, event) {
  const h = request.headers;
  console.log(JSON.stringify({
    event, label,
    city: decodeURIComponent(h.get('x-vercel-ip-city') || ''),
    country: h.get('x-vercel-ip-country') || '',
    ip: (h.get('x-forwarded-for') || '').split(',')[0],
    device: h.get('user-agent') || '',
  }));
}

function locked(title, text, status) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Private preview</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f2ee;color:#1d1d1b;font:16px/1.5 system-ui,sans-serif;padding:16px;box-sizing:border-box}
.c{max-width:420px;background:#fff;border:1px solid #e2ded6;border-radius:14px;padding:28px}h1{font-size:1.25rem;margin:0 0 8px}p{margin:0 0 6px;color:#555}b{color:#1d1d1b}</style></head>
<body><div class="c"><h1>${title}</h1><p>${text}</p><p>Built by <b>Stravitech</b>.</p></div></body></html>`;
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}

export default function middleware(request) {
  const until = process.env.PREVIEW_UNTIL;
  if (until && Date.now() > new Date(until + 'T23:59:59+05:30').getTime()) {
    return locked('This preview has ended', 'Please contact Stravitech for access.', 410);
  }

  const valid = keys();
  const url = new URL(request.url);
  const given = url.searchParams.get('k');

  if (given) {
    const label = valid.get(given);
    if (!label) return locked('This link is not valid', 'Please ask Stravitech for a new link.', 403);
    log(request, label, 'link-opened');
    url.searchParams.delete('k');
    return new Response(null, {
      status: 302,
      headers: {
        location: url.pathname + url.search,
        'set-cookie': `${COOKIE}=${encodeURIComponent(given)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
        'cache-control': 'no-store',
      },
    });
  }

  const label = valid.get(cookie(request, COOKIE));
  if (!label) return locked('Private preview', 'This page is a private preview. Please open it using the link you were sent.', 401);
  if (url.pathname === '/' || url.pathname === '/index.html') log(request, label, 'visit');
  return next({ headers: { 'cache-control': 'private, no-store' } });
}
