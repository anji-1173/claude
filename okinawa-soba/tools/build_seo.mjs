// 沖縄そば巡りの旅 — SEO用の静的ページ生成スクリプト
// 使い方（okinawa-soba フォルダで）: node tools/build_seo.mjs
// index.html のデータ（ARTICLES / SOBA_SHOPS / PHOTOS / SHOP_GEO_DATA）から
//   - shop/<店名>/index.html（お店ごとの記事ページ。Googleが読める本物のHTML）
//   - sitemap.xml
//   - index.html 内の「お店別の記事ページ一覧」（SEO-INDEX マーカーの間）
// を作り直す。記事を追加・修正したら毎回実行する。
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://anji-1173.github.io/okinawa-soba/';
const SITE_NAME = '沖縄そば巡りの旅';
const AUTHOR = 'アンジ';
const TODAY = new Date().toISOString().slice(0, 10);

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// ---- JSのオブジェクトリテラルを、文字列を考慮して括弧の対応で切り出す
function literalAfter(marker) {
  const i = html.indexOf(marker);
  if (i < 0) throw new Error('not found: ' + marker);
  let j = i + marker.length;
  while (html[j] !== '{' && html[j] !== '[') j++;
  const start = j; let depth = 0; let q = null;
  for (; j < html.length; j++) {
    const c = html[j];
    if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') { depth--; if (depth === 0) break; }
  }
  return new Function('return (' + html.slice(start, j + 1) + ')')();
}
const ARTICLES = literalAfter('const ARTICLES = ');
const SHOPS = literalAfter('const SOBA_SHOPS = ');
const PHOTOS = literalAfter('const PHOTOS = ');
const GEO = literalAfter('window.SHOP_GEO_DATA = ');
const REGION_LABEL = { naha: '那覇エリア', south: '南部エリア', central: '中部エリア', north: '北部エリア', other: '沖縄本島' };
const REGION_ORDER = ['naha', 'south', 'central', 'north', 'other'];

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = s => String(s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
// フォルダ名：店名から URL に向かない文字を除く（空白は - に）
const slugFS = name => name.replace(/[\/\\?#%&:*"<>|]/g, '').replace(/[\s\u3000]+/g, '-').replace(/^-+|-+$/g, '');
const pageURL = s => SITE + 'shop/' + encodeURIComponent(slugFS(s.name)) + '/';
const absPhoto = p => SITE + p.split('/').map(encodeURIComponent).join('/');
const areaOf = s => (s.area === '—' ? '沖縄本島' : s.area);
const galleryOf = s => (s.photoKey && PHOTOS[s.photoKey]) ? PHOTOS[s.photoKey].photos : (s.photo ? [s.photo] : []);

// 重複フォルダ名のチェック
const seen = new Map();
for (const s of SHOPS) {
  const k = slugFS(s.name);
  if (seen.has(k)) throw new Error('slug重複: ' + s.name + ' / ' + seen.get(k));
  seen.set(k, s.name);
}

const CSS = `
:root{--ink:#f2fbfd;--ink2:#e3f4fa;--panel:#fff;--line:#bfe3ef;--gold:#0a7ea4;--gold2:#00b4d8;--cream:#0b3d54;--text:#123c50;--muted:#4a6b7d;
--serif:"Zen Old Mincho","Hiragino Mincho ProN",serif;--sans:"Noto Sans JP","Hiragino Kaku Gothic ProN",sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--ink);color:var(--text);font-family:var(--sans);line-height:1.9;overflow-x:hidden}
a{color:var(--gold)}
.top{background:#043a5c;color:#fff;padding:.9rem 16px}
.top a{color:#fff;text-decoration:none;font-family:var(--serif);font-weight:700;letter-spacing:.08em;font-size:1.1rem}
main{max-width:44em;margin:0 auto;padding:1.4rem 16px 3rem}
.crumb{font-size:.78rem;color:var(--muted);margin-bottom:1rem}
.crumb a{color:var(--muted)}
.eyebrow{font-size:.78rem;color:var(--gold);letter-spacing:.2em}
h1{font-family:var(--serif);color:var(--cream);font-size:clamp(1.6rem,6vw,2.3rem);line-height:1.4;margin:.2rem 0 .6rem}
.meta{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1.2rem;font-size:.8rem}
.meta span{border:1px solid var(--line);border-radius:999px;padding:.1rem .7rem;background:var(--panel)}
.meta .rank{background:#f2b705;border-color:#f2b705;color:#3a2a00;font-weight:700}
.lead{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:1rem 1.2rem;font-size:.92rem;margin-bottom:1.6rem}
.hero{width:100%;border-radius:10px;display:block;margin-bottom:1.6rem}
.body p{margin:1.1rem 0}
.body figure{margin:2rem 0}
.body figure img,.body figure video{width:100%;border-radius:8px;border:1px solid var(--line);display:block}
.body figure video{max-height:80vh;object-fit:contain;background:#000}
.body figcaption{color:var(--muted);font-size:.78rem;margin-top:.5rem}
.art-visit{font-family:var(--serif);color:var(--gold);font-size:1.25rem;text-align:center;margin:3rem 0 1.4rem;padding-top:2rem;border-top:1px solid var(--line)}
.art-stars{display:block;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:.9rem 1.2rem;font-family:var(--serif);line-height:2}
.info{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:1rem 1.2rem;margin:2.4rem 0;font-size:.9rem}
.info h2{font-family:var(--serif);font-size:1.05rem;color:var(--cream);margin-bottom:.4rem}
.info dl{display:grid;grid-template-columns:5em 1fr;gap:.2rem .8rem}
.info dt{color:var(--muted)}
.cta{display:block;text-align:center;background:var(--gold);color:#fff;text-decoration:none;border-radius:999px;padding:.8rem 1rem;font-weight:700;margin:1.6rem 0}
.nav{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin-top:1.6rem;font-size:.85rem}
.nav a{display:block;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:.7rem .9rem;text-decoration:none;color:var(--text)}
.nav .r{text-align:right}
.nav small{display:block;color:var(--muted);font-size:.72rem}
footer{text-align:center;color:var(--muted);font-size:.78rem;padding:2rem 16px;border-top:1px solid var(--line)}
`;

function renderBody(items) {
  return items.map(p => {
    if (p && typeof p === 'object') {
      if (p.html) return p.html;
      if (p.video) return `<figure><video src="../../${esc(p.video)}"${p.poster ? ` poster="../../${esc(p.poster)}"` : ''} controls playsinline preload="metadata"></video><figcaption>${esc(p.cap || '')}</figcaption></figure>`;
      if (p.img) return `<figure><img src="../../${esc(p.img)}" alt="${esc(p.cap || '')}" loading="lazy"><figcaption>${esc(p.cap || '')}</figcaption></figure>`;
      return '';
    }
    if (String(p).includes('class="art-stars"')) return `<p>${p}</p>`;
    return `<p>${p}</p>`;
  }).join('\n');
}

function scoreOf(items) {
  let last = null;
  for (const p of items) {
    if (typeof p !== 'string') continue;
    const m = [...p.matchAll(/評価（\s*(\d+(?:\.\d+)?)\s*点\s*[\/／]\s*15\s*点\s*）/g)];
    if (m.length) last = parseFloat(m[m.length - 1][1]);
  }
  return last;
}

const indexed = [];
fs.rmSync(path.join(ROOT, 'shop'), { recursive: true, force: true });
SHOPS.forEach((s, i) => {
  const items = ARTICLES[s.name];
  const hasArticle = Array.isArray(items) && items.length > 0;
  const g = galleryOf(s);
  const geo = GEO[s.name] && !Array.isArray(GEO[s.name]) ? GEO[s.name] : null;
  const url = pageURL(s);
  const area = areaOf(s);
  const title = `${s.name}（${area}）の沖縄そばレビュー｜${SITE_NAME}`;
  const desc = cut(strip(s.desc), 120);
  const img = g.length ? absPhoto(g[0]) : SITE + 'icon-512.png';
  const score = hasArticle ? scoreOf(items) : null;
  const prev = SHOPS[(i - 1 + SHOPS.length) % SHOPS.length];
  const next = SHOPS[(i + 1) % SHOPS.length];
  const rel = s2 => '../' + encodeURIComponent(slugFS(s2.name)) + '/';

  const restaurant = {
    '@type': 'Restaurant', name: s.name, servesCuisine: '沖縄そば', image: img,
    address: { '@type': 'PostalAddress', addressRegion: '沖縄県', addressCountry: 'JP', ...(geo?.addr ? { streetAddress: geo.addr } : { addressLocality: area }) },
    ...(geo ? { geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng } } : {}),
  };
  const ld = [
    hasArticle ? {
      '@context': 'https://schema.org', '@type': 'Review', name: `${s.name}の沖縄そばレビュー`, url,
      author: { '@type': 'Person', name: AUTHOR },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE },
      itemReviewed: restaurant,
      ...(score != null ? { reviewRating: { '@type': 'Rating', ratingValue: score, bestRating: 15, worstRating: 0 } } : {}),
      reviewBody: cut(strip(items.filter(x => typeof x === 'string' && !x.includes('art-stars')).join(' ')), 300),
    } : { '@context': 'https://schema.org', ...restaurant },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE },
        { '@type': 'ListItem', position: 2, name: REGION_LABEL[s.region] || '沖縄本島', item: SITE + '#list' },
        { '@type': 'ListItem', position: 3, name: s.name, item: url },
      ]
    },
  ];
  const gq = encodeURIComponent(geo?.addr ? s.name + ' ' + geo.addr : s.name + ' 沖縄そば');
  const body = hasArticle ? renderBody(items) : `<p>${esc(s.desc)}</p>`;
  const page = `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${hasArticle ? '' : '<meta name="robots" content="noindex">\n'}<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(s.name + '（' + area + '）の沖縄そばレビュー')}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#043a5c">
<link rel="icon" type="image/png" href="../../icon-192.png">
<link rel="apple-touch-icon" href="../../icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;700&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body>
<header class="top"><a href="../../">🍜 ${SITE_NAME}</a></header>
<main>
<nav class="crumb"><a href="../../">トップ</a> › ${esc(REGION_LABEL[s.region] || '沖縄本島')} › ${esc(s.name)}</nav>
<div class="eyebrow">沖縄そば巡りの旅</div>
<h1>${esc(s.name)}</h1>
<div class="meta"><span>${esc(area)}</span>${s.rank ? `<span class="rank">${esc(s.rank)}</span>` : ''}${(s.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}${score != null ? `<span>評価 ${score}点/15点</span>` : ''}</div>
<p class="lead">${esc(s.desc)}</p>
${g.length && !(hasArticle && items.some(x => x && x.img === g[0])) ? `<img class="hero" src="../../${esc(g[0])}" alt="${esc(s.name)}の沖縄そば">` : ''}
<article class="body">
${body}
</article>
<section class="info">
<h2>お店の情報</h2>
<dl><dt>店名</dt><dd>${esc(s.name)}</dd><dt>エリア</dt><dd>${esc(area)}（${esc(REGION_LABEL[s.region] || '沖縄本島')}）</dd>${geo?.addr ? `<dt>住所</dt><dd>${esc(geo.addr)}</dd>` : ''}</dl>
<p style="margin-top:.6rem"><a href="https://www.google.com/maps/search/?api=1&amp;query=${gq}" target="_blank" rel="noopener">Googleマップで見る</a></p>
</section>
<a class="cta" href="../../#shop/${encodeURIComponent(s.name)}">地図やほかのお店も見る（${SHOPS.length}軒）</a>
<nav class="nav">
<a href="${rel(prev)}"><small>← 前のお店</small>${esc(prev.name)}</a>
<a class="r" href="${rel(next)}"><small>次のお店 →</small>${esc(next.name)}</a>
</nav>
</main>
<footer>沖縄本島の沖縄そば屋、全店制覇が目標。<br>© ${SITE_NAME}（${AUTHOR}）</footer>
</body>
</html>
`;
  const dir = path.join(ROOT, 'shop', slugFS(s.name));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page);
  if (hasArticle) indexed.push({ s, url });
});

// ---- sitemap.xml
const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE}</loc><lastmod>${TODAY}</lastmod><priority>1.0</priority></url>
${indexed.map(x => `<url><loc>${esc(x.url)}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm);

// ---- index.html にお店別ページへのリンク一覧を入れる（Googleがたどれるように）
const S = '<!--SEO-INDEX-START-->', E = '<!--SEO-INDEX-END-->';
const groups = REGION_ORDER.map(r => {
  const list = indexed.filter(x => x.s.region === r);
  if (!list.length) return '';
  return `<h3>${REGION_LABEL[r]}（${list.length}軒）</h3><ul>` +
    list.map(x => `<li><a href="shop/${encodeURIComponent(slugFS(x.s.name))}/">${esc(x.s.name)}</a></li>`).join('') + '</ul>';
}).join('');
const block = `${S}
<section class="seo-index" aria-label="お店別の記事ページ">
<details><summary>お店別の記事ページ一覧（${indexed.length}軒）</summary>${groups}</details>
</section>
${E}`;
if (html.includes(S)) html = html.slice(0, html.indexOf(S)) + block + html.slice(html.indexOf(E) + E.length);
else html = html.replace('<footer>', block + '\n\n<footer>');
fs.writeFileSync(path.join(ROOT, 'index.html'), html);

console.log(`shop pages: ${SHOPS.length}（記事あり ${indexed.length} / 記事なし noindex ${SHOPS.length - indexed.length}）`);
console.log('sitemap urls:', indexed.length + 1);
