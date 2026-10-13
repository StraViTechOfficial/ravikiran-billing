// Builds the hosted copy into public/: minified script, prototype watermark,
// and a lock so a saved copy of the page won't run anywhere except our domain.
// The source index.html stays readable and still opens locally by double-click.
const fs = require('fs');
const { minify } = require('terser');

const ALLOWED_HOSTS = ['ravikiran.stravitech.com'];

const guard = `<script>(function(){var h=location.hostname;if(!(${JSON.stringify(ALLOWED_HOSTS)}.indexOf(h)>-1||/\\.vercel\\.app$/.test(h))){addEventListener('DOMContentLoaded',function(){document.body.innerHTML='<p style="font:16px system-ui;padding:40px">This prototype only runs at ravikiran.stravitech.com. Built by Stravitech.</p>'});document.write('<plaintext style="display:none">')}})();</script>`;

const watermark = `<style>
.doc{position:relative}
.doc::after{content:"PROTOTYPE \\00B7  STRAVITECH";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font:700 64px/1 Archivo,sans-serif;letter-spacing:.08em;color:rgba(0,0,0,.06);white-space:nowrap;pointer-events:none}
</style>`;

(async () => {
  let html = fs.readFileSync('index.html', 'utf8');

  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('inline <script> not found');
  const out = await minify(m[1], { compress: true, mangle: { toplevel: true }, format: { comments: false } });
  html = html.replace(m[0], () => `<script>${out.code}</script>`);

  html = html.replace('<title>', () => `${guard}\n<title>`);
  html = html.replace('</head>', () => `${watermark}\n</head>`);
  html = html.replace(/<div class="side-foot">[^<]*<\/div>/, '<div class="side-foot">Prototype by Stravitech · for Ravi Kiran Enterprises</div>');

  fs.mkdirSync('public', { recursive: true });
  fs.writeFileSync('public/index.html', html);
  console.log(`public/index.html  ${(html.length / 1024).toFixed(0)} KB`);
})();
