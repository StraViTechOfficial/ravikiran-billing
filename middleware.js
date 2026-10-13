// Private, one-time-link gate for the prototype.
// Env vars (Vercel → Settings → Environment Variables, redeploy after changing):
//   ACCESS_KEYS   = "ravi:k7f3x9q2,me:p4m8w1z6"   label:key pairs, comma separated
//   MAX_DEVICES   = "2"                            optional; devices allowed per key (default 2)
//   PREVIEW_UNTIL = "2026-11-15"                   optional; after this date the link stops working
//   KV_REST_API_URL / KV_REST_API_TOKEN            added by the Upstash Redis integration
// Share  https://ravikiran.stravitech.com/?k=<key>. The first devices to open it claim the key;
// after that the link shows "already used" anywhere else. To reset a key, give that person a new key.
// Every visit is logged (label, city, device) in Vercel → Logs.
import { next } from '@vercel/functions';

export const config = { runtime: 'nodejs' };

const COOKIE = 'rk_dev';
const MAX_AGE = 60 * 60 * 24 * 90;

// Atomically: already-claimed device → 1; free slot → claim it, 1; full → 0.
const CLAIM = `if redis.call('SISMEMBER',KEYS[1],ARGV[1])==1 then return 1 end
if redis.call('SCARD',KEYS[1])<tonumber(ARGV[2]) then redis.call('SADD',KEYS[1],ARGV[1]) return 1 end
return 0`;

function keys() {
  const map = new Map();
  for (const pair of (process.env.ACCESS_KEYS || '').split(',')) {
    const [label, key] = pair.split(':').map(s => s && s.trim());
    if (label && key && key.length >= 6) map.set(key, label);
  }
  return map;
}

async function redis(cmd) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Redis not configured');
  const res = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(cmd) });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

const claim = (key, device) => redis(['EVAL', CLAIM, '1', `rk:dev:${key}`, device, String(Number(process.env.MAX_DEVICES) || 2)]);
const owns = (key, device) => redis(['SISMEMBER', `rk:dev:${key}`, device]);

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

export default async function middleware(request) {
  const until = process.env.PREVIEW_UNTIL;
  if (until && Date.now() > new Date(until + 'T23:59:59+05:30').getTime()) {
    return locked('This preview has ended', 'Please contact Stravitech for access.', 410);
  }

  const valid = keys();
  const url = new URL(request.url);
  const given = url.searchParams.get('k');
  const [cKey, cDevice] = cookie(request, COOKIE).split('.');

  try {
    if (given) {
      const label = valid.get(given);
      if (!label) return locked('This link is not valid', 'Please ask Stravitech for a new link.', 403);
      const device = cKey === given && cDevice ? cDevice : crypto.randomUUID();
      if (!(await claim(given, device))) {
        log(request, label, 'link-blocked');
        return locked('This link has already been used', 'It works only on the phone or computer it was first opened on.', 403);
      }
      log(request, label, 'link-opened');
      url.searchParams.delete('k');
      return new Response(null, {
        status: 302,
        headers: {
          location: url.pathname + url.search,
          'set-cookie': `${COOKIE}=${given}.${device}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          'cache-control': 'no-store',
        },
      });
    }

    const label = valid.get(cKey);
    if (!label || !cDevice || !(await owns(cKey, cDevice))) {
      return locked('Private preview', 'This page is a private preview. Please open it using the link you were sent.', 401);
    }
    if (url.pathname === '/' || url.pathname === '/index.html') log(request, label, 'visit');
    return next({ headers: { 'cache-control': 'private, no-store' } });
  } catch (err) {
    console.error('gate error', err.message);
    return locked('Temporarily unavailable', 'Please try again in a few minutes.', 503);
  }
}
