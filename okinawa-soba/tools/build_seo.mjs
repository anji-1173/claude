// 沖縄そば巡りの旅 — SEO用の静的ページ生成スクリプト
// 使い方（okinawa-soba フォルダで）: node tools/i18n_build.mjs && node tools/build_seo.mjs
// index.html のデータ（ARTICLES / SOBA_SHOPS / PHOTOS / SHOP_GEO_DATA）と翻訳（i18n/<lang>.js）から
//   - shop/<店名>/index.html（日本語）、<lang>/shop/<店名>/index.html（英・韓・繁・簡）
//     … お店ごとの記事ページ。Googleが読める本物のHTML。言語どうしは hreflang で結ぶ
//   - sitemap.xml
//   - index.html 内の「お店別の記事ページ一覧」（SEO-INDEX マーカーの間）
// を作り直す。記事を追加・修正したら毎回実行する。
import fs from 'fs';
import path from 'path';
import { ROOT, readData } from './i18n_lib.mjs';

const SITE = 'https://okinawa-soba.apps-okinawa.workers.dev/';
const AUTHORS = { ja: 'アンジ', en: 'Anji', ko: '안지', 'zh-TW': '安吉', 'zh-CN': '安吉' }; // 筆者名（その言語の表記）
const TODAY = new Date().toISOString().slice(0, 10);
const LANGS = ['ja', 'en', 'ko', 'zh-TW', 'zh-CN'];
const OG_LOCALE = { ja: 'ja_JP', en: 'en_US', ko: 'ko_KR', 'zh-TW': 'zh_TW', 'zh-CN': 'zh_CN' };

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const { ARTICLES, SHOPS, PHOTOS, GEO } = readData(html);
const UI_ALL = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'ui.json'), 'utf8'));
// 翻訳データ（tools/i18n_build.mjs が作った i18n/<lang>.js）
const TRANS = { ja: { ui: UI_ALL.ja, shops: {} } };
for (const l of LANGS.slice(1)) {
  const f = path.join(ROOT, 'i18n', `${l}.js`);
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  TRANS[l] = JSON.parse(src.slice(src.indexOf('window.I18N=') + 'window.I18N='.length).replace(/;\s*$/, ''));
}
const REGION_ORDER = ['naha', 'south', 'central', 'north', 'other'];
// うんちくコーナー（i18n/trivia.json）
const TRV = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'trivia.json'), 'utf8'));
const triviaOf = l => (l === 'ja' ? TRV.ja : (TRANS[l] && TRANS[l].trivia ? TRANS[l].trivia.topics : null));
const triviaURL = l => SITE + langDir(l) + 'trivia/';
const triviaLangs = () => LANGS.filter(l => TRANS[l] && triviaOf(l));

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = s => String(s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
// フォルダ名：店名から URL に向かない文字を除く（空白は - に）
const slugFS = name => name.replace(/[\/\\?#%&:*"<>|]/g, '').replace(/[\s\u3000]+/g, '-').replace(/^-+|-+$/g, '');
const langDir = l => (l === 'ja' ? '' : l + '/');
const pageURL = (s, l = 'ja') => SITE + langDir(l) + 'shop/' + encodeURIComponent(slugFS(s.name)) + '/';
const absPhoto = p => SITE + p.split('/').map(encodeURIComponent).join('/');
const galleryOf = s => (s.photoKey && PHOTOS[s.photoKey]) ? PHOTOS[s.photoKey].photos : (s.photo ? [s.photo] : []);
const fmt = (t, ...a) => a.reduce((x, v, i) => x.split(`{${i}}`).join(v), t);

// 重複フォルダ名のチェック
const seen = new Map();
for (const s of SHOPS) {
  const k = slugFS(s.name);
  if (seen.has(k)) throw new Error('slug重複: ' + s.name + ' / ' + seen.get(k));
  seen.set(k, s.name);
}

// その言語で表示できる店か（記事の翻訳がある）
const hasLang = (s, l) => l === 'ja' ? Array.isArray(ARTICLES[s.name]) && ARTICLES[s.name].length > 0
  : !!(TRANS[l] && TRANS[l].shops[s.name] && TRANS[l].shops[s.name].art);

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
h1{font-family:var(--serif);color:var(--cream);font-size:clamp(1.6rem,6vw,2.3rem);line-height:1.4;margin:.2rem 0 .3rem}
.orig{color:var(--muted);font-size:.85rem;margin-bottom:.6rem}
.meta{display:flex;flex-wrap:wrap;gap:.4rem;margin:.6rem 0 1.2rem;font-size:.8rem}
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
.info dl{display:grid;grid-template-columns:6em 1fr;gap:.2rem .8rem}
.info dt{color:var(--muted)}
.cta{display:block;text-align:center;background:var(--gold);color:#fff;text-decoration:none;border-radius:999px;padding:.8rem 1rem;font-weight:700;margin:1.6rem 0}
.nav{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin-top:1.6rem;font-size:.85rem}
.nav a{display:block;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:.7rem .9rem;text-decoration:none;color:var(--text)}
.nav .r{text-align:right}
.nav small{display:block;color:var(--muted);font-size:.72rem}
footer{text-align:center;color:var(--muted);font-size:.78rem;padding:2rem 16px 5rem;border-top:1px solid var(--line)}
`;

function renderBody(items, up) {
  return items.map(p => {
    if (p && typeof p === 'object') {
      if (p.html) return p.html;
      if (p.video) return `<figure><video src="${up}${esc(p.video)}"${p.poster ? ` poster="${up}${esc(p.poster)}"` : ''} controls playsinline preload="metadata"></video><figcaption>${esc(p.cap || '')}</figcaption></figure>`;
      if (p.img) return `<figure><img src="${up}${esc(p.img)}" alt="${esc(p.cap || '')}" loading="lazy"><figcaption>${esc(p.cap || '')}</figcaption></figure>`;
      return '';
    }
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

fs.rmSync(path.join(ROOT, 'shop'), { recursive: true, force: true });
fs.rmSync(path.join(ROOT, 'trivia'), { recursive: true, force: true });
for (const l of LANGS.slice(1)) fs.rmSync(path.join(ROOT, l), { recursive: true, force: true });

const indexed = []; // {s, lang, url}
for (const lang of LANGS) {
  if (!TRANS[lang]) continue;
  const UI = { ...UI_ALL.ja, ...TRANS[lang].ui };
  const U = (k, ...a) => fmt(UI[k] ?? k, ...a);
  const up = lang === 'ja' ? '../../' : '../../../';
  const AUTHOR = AUTHORS[lang];
  const paren = x => (lang === 'ja' || lang.startsWith('zh')) ? `（${x}）` : ` (${x})`;
  const list = SHOPS.filter(s => hasLang(s, lang));
  list.forEach((s, i) => {
    const T = lang === 'ja' ? null : TRANS[lang].shops[s.name];
    const items = lang === 'ja' ? ARTICLES[s.name] : T.art;
    const name = T ? T.name : s.name;
    const area = s.area === '—' ? U('honto') : (T ? T.area : s.area);
    const desc = T ? T.desc : s.desc;
    const rank = s.rank ? (T && T.rank ? T.rank : s.rank) : '';
    const g = galleryOf(s);
    const geo = GEO[s.name] && !Array.isArray(GEO[s.name]) ? GEO[s.name] : null;
    const url = pageURL(s, lang);
    const title = `${U('sp_title', name, area)}｜${U('site')}`.replace('｜', lang === 'ja' || lang.startsWith('zh') ? '｜' : ' | ');
    const mdesc = cut(strip(desc), 120);
    const img = g.length ? absPhoto(g[0]) : SITE + 'icon-512.png';
    const score = scoreOf(ARTICLES[s.name] || []);
    const prev = list[(i - 1 + list.length) % list.length];
    const next = list[(i + 1) % list.length];
    const rel = s2 => '../' + encodeURIComponent(slugFS(s2.name)) + '/';
    const nmOf = s2 => (lang === 'ja' ? s2.name : TRANS[lang].shops[s2.name].name);
    const region = U('reg_' + (s.region || 'other'));
    const alts = LANGS.filter(l2 => TRANS[l2] && hasLang(s, l2));

    const restaurant = {
      '@type': 'Restaurant', name, alternateName: name !== s.name ? s.name : undefined, servesCuisine: 'Okinawa soba', image: img,
      address: { '@type': 'PostalAddress', addressRegion: '沖縄県', addressCountry: 'JP', ...(geo?.addr ? { streetAddress: geo.addr } : { addressLocality: s.area }) },
      ...(geo ? { geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng } } : {}),
    };
    const ld = [
      {
        '@context': 'https://schema.org', '@type': 'Review', name: U('sp_title', name, area), url, inLanguage: lang,
        author: { '@type': 'Person', name: AUTHOR },
        publisher: { '@type': 'Organization', name: U('site'), url: SITE },
        itemReviewed: restaurant,
        ...(score != null ? { reviewRating: { '@type': 'Rating', ratingValue: score, bestRating: 15, worstRating: 0 } } : {}),
        reviewBody: cut(strip(items.filter(x => typeof x === 'string' && !x.includes('art-stars')).join(' ')), 300),
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: U('site'), item: SITE },
          { '@type': 'ListItem', position: 2, name: region, item: SITE + '#shops' },
          { '@type': 'ListItem', position: 3, name, item: url },
        ]
      },
    ];
    const gq = encodeURIComponent(geo?.addr ? s.name + ' ' + geo.addr : s.name + ' 沖縄そば');
    const ctaHref = `${up}${lang === 'ja' ? '' : '?lang=' + lang}#shop/${encodeURIComponent(s.name)}`;
    const page = `<!doctype html>
<html lang="${lang}" data-static>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(mdesc)}">
<link rel="canonical" href="${esc(url)}">
${alts.map(l2 => `<link rel="alternate" hreflang="${l2}" href="${esc(pageURL(s, l2))}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${esc(pageURL(s, 'ja'))}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(U('site'))}">
<meta property="og:title" content="${esc(U('sp_title', name, area))}">
<meta property="og:description" content="${esc(mdesc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#043a5c">
<link rel="icon" type="image/png" href="${up}icon-192.png">
<link rel="apple-touch-icon" href="${up}icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;700&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body>
<header class="top"><a href="${up}${lang === 'ja' ? '' : '?lang=' + lang}">🍜 ${esc(U('site'))}</a></header>
<main>
<nav class="crumb"><a href="${up}${lang === 'ja' ? '' : '?lang=' + lang}">${esc(U('sp_top'))}</a> › ${esc(region)} › ${esc(name)}</nav>
<div class="eyebrow">${esc(U('site'))}</div>
<h1>${esc(name)}</h1>
${name !== s.name ? `<div class="orig" lang="ja">${esc(s.name)}</div>` : ''}
<div class="meta"><span>${esc(area)}</span>${rank ? `<span class="rank">${esc(rank)}</span>` : ''}${(s.tags || []).map(t => `<span>${esc(U('tag_' + t))}</span>`).join('')}${score != null ? `<span>${esc(U('sp_rating', score))}</span>` : ''}</div>
<p class="lead">${esc(desc)}</p>
${g.length && !items.some(x => x && x.img === g[0]) ? `<img class="hero" src="${up}${esc(g[0])}" alt="${esc(U('photo_alt', name))}">` : ''}
<article class="body">
${renderBody(items, up)}
</article>
<section class="info">
<h2>${esc(U('sp_info'))}</h2>
<dl><dt>${esc(U('sp_name'))}</dt><dd>${esc(name)}${name !== s.name ? `<br><span lang="ja">${esc(s.name)}</span>` : ''}</dd><dt>${esc(U('sp_area'))}</dt><dd>${esc(area)}${esc(paren(region))}</dd>${geo?.addr ? `<dt>${esc(U('sp_addr'))}</dt><dd lang="ja">${esc(geo.addr)}</dd>` : ''}</dl>
<p style="margin-top:.6rem"><a href="https://www.google.com/maps/search/?api=1&amp;query=${gq}" target="_blank" rel="noopener">${esc(U('sp_gmaps'))}</a></p>
</section>
<a class="cta" href="${ctaHref}">${esc(U('sp_cta', SHOPS.length))}</a>
<nav class="nav">
<a href="${rel(prev)}"><small>${esc(U('prev'))}</small>${esc(nmOf(prev))}</a>
<a class="r" href="${rel(next)}"><small>${esc(U('next'))}</small>${esc(nmOf(next))}</a>
</nav>
</main>
<footer>${esc(U('sp_footer'))}<br>© ${esc(U('site'))}（${AUTHOR}）</footer>
<script src="${up}i18n.js" defer></script>
</body>
</html>
`;
    const dir = path.join(ROOT, langDir(lang), 'shop', slugFS(s.name));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), page);
    indexed.push({ s, lang, url, alts });
  });
  // ---- うんちくのページ（全話題を1ページに。アプリ側の #trivia と同じ内容）
  const topics = triviaOf(lang);
  if (topics) {
    const upT = lang === 'ja' ? '../' : '../../';
    const home = `${upT}${lang === 'ja' ? '' : '?lang=' + lang}`;
    const tUrl = triviaURL(lang);
    const tTitle = `${U('trivia_title')}${lang === 'ja' || lang.startsWith('zh') ? '｜' : ' | '}${U('site')}`;
    const tDesc = cut(strip(U('trivia_lead')), 120);
    const byName = Object.fromEntries(SHOPS.map(s => [s.name, s]));
    const nmOf = s2 => (lang === 'ja' ? s2.name : TRANS[lang].shops[s2.name].name);
    const bodyOf = t => t.body.map(p => (p && p.list) ? `<ul>${p.list.map(x => `<li>${x}</li>`).join('')}</ul>` : `<p>${p}</p>`).join('\n');
    const relOf = t => (TRV.shops[t.id] || []).map(n => byName[n]).filter(s2 => s2 && hasLang(s2, lang));
    const ldT = {
      '@context': 'https://schema.org', '@type': 'Article', headline: U('trivia_title'), url: tUrl, inLanguage: lang,
      author: { '@type': 'Person', name: AUTHOR }, publisher: { '@type': 'Organization', name: U('site'), url: SITE },
      about: 'Okinawa soba', articleSection: topics.map(t => t.title),
    };
    const pageT = `<!doctype html>
<html lang="${lang}" data-static>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(tTitle)}</title>
<meta name="description" content="${esc(tDesc)}">
<link rel="canonical" href="${esc(tUrl)}">
${triviaLangs().map(l2 => `<link rel="alternate" hreflang="${l2}" href="${esc(triviaURL(l2))}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${esc(triviaURL('ja'))}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(U('site'))}">
<meta property="og:title" content="${esc(U('trivia_title'))}">
<meta property="og:description" content="${esc(tDesc)}">
<meta property="og:url" content="${esc(tUrl)}">
<meta property="og:image" content="${SITE}photos/002/01.jpg">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#043a5c">
<link rel="icon" type="image/png" href="${upT}icon-192.png">
<link rel="apple-touch-icon" href="${upT}icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;700&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
<style>${CSS}
.toc{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:.6rem;margin:1.2rem 0 2rem}
.toc a{display:flex;gap:.6rem;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:.7rem .9rem;text-decoration:none;color:var(--text);font-size:.92rem}
.topic{border-top:1px solid var(--line);padding-top:1.6rem;margin-top:1.8rem}
.topic h2{font-family:var(--serif);color:var(--cream);font-size:1.35rem;line-height:1.5;margin-bottom:.6rem}
.topic ul{list-style:none;margin:1rem 0}
.topic li{padding:.6rem 0;border-top:1px dashed var(--line)}
.rel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:.8rem 1rem;margin-top:1rem;font-size:.88rem}
.rel a{display:inline-block;margin:.2rem .6rem .2rem 0}
.note{color:var(--muted);font-size:.76rem;margin-top:2rem}
</style>
<script type="application/ld+json">${JSON.stringify(ldT).replace(/</g, '\\u003c')}</script>
</head>
<body>
<header class="top"><a href="${home}">🍜 ${esc(U('site'))}</a></header>
<main>
<nav class="crumb"><a href="${home}">${esc(U('sp_top'))}</a> › ${esc(U('trivia_title'))}</nav>
<div class="eyebrow">${esc(U('site'))}</div>
<h1>${esc(U('trivia_title'))}</h1>
<p class="lead">${esc(U('trivia_lead'))}</p>
<nav class="toc">${topics.map(t => `<a href="#${t.id}"><span>${t.icon}</span><span>${t.title}</span></a>`).join('')}</nav>
<article class="body">
${topics.map(t => `<section class="topic" id="${t.id}">
<h2>${t.icon} ${t.title}</h2>
${bodyOf(t)}
${relOf(t).length ? `<div class="rel"><b>🍜 ${esc(U('trivia_related'))}</b><br>${relOf(t).map(s2 => `<a href="../shop/${encodeURIComponent(slugFS(s2.name))}/">${esc(nmOf(s2))}</a>`).join('')}</div>` : ''}
</section>`).join('\n')}
</article>
<p class="note">${esc(U('trivia_note'))}</p>
<a class="cta" href="${home}#trivia">${esc(U('sp_cta', SHOPS.length))}</a>
</main>
<footer>${esc(U('sp_footer'))}<br>© ${esc(U('site'))}（${AUTHOR}）</footer>
<script src="${upT}i18n.js" defer></script>
</body>
</html>
`;
    const dirT = path.join(ROOT, langDir(lang), 'trivia');
    fs.mkdirSync(dirT, { recursive: true });
    fs.writeFileSync(path.join(dirT, 'index.html'), pageT);
  }
  console.log(`${lang}: ${list.length} pages${topics ? ' + trivia' : ''}`);
}

// ---- sitemap.xml（言語ちがいのページを hreflang で結ぶ）
const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url><loc>${SITE}</loc><lastmod>${TODAY}</lastmod><priority>1.0</priority></url>
${triviaLangs().map(l => `<url><loc>${esc(triviaURL(l))}</loc><lastmod>${TODAY}</lastmod><priority>0.8</priority>${triviaLangs().map(l2 => `<xhtml:link rel="alternate" hreflang="${l2}" href="${esc(triviaURL(l2))}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${esc(triviaURL('ja'))}"/></url>`).join('\n')}
${indexed.map(x => `<url><loc>${esc(x.url)}</loc><lastmod>${TODAY}</lastmod>${x.alts.map(l2 => `<xhtml:link rel="alternate" hreflang="${l2}" href="${esc(pageURL(x.s, l2))}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${esc(pageURL(x.s, 'ja'))}"/></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm);

// ---- index.html にお店別ページへのリンク一覧を入れる（Googleがたどれるように。日本語ページ）
const ja = indexed.filter(x => x.lang === 'ja');
const RL = UI_ALL.ja;
const S = '<!--SEO-INDEX-START-->', E = '<!--SEO-INDEX-END-->';
const groups = REGION_ORDER.map(r => {
  const list = ja.filter(x => x.s.region === r);
  if (!list.length) return '';
  return `<h3>${RL['reg_' + r]}（${list.length}軒）</h3><ul>` +
    list.map(x => `<li><a href="shop/${encodeURIComponent(slugFS(x.s.name))}/">${esc(x.s.name)}</a></li>`).join('') + '</ul>';
}).join('');
const block = `${S}
<section class="seo-index" aria-label="お店別の記事ページ">
<details><summary>お店別の記事ページ一覧（${ja.length}軒）</summary>${groups}</details>
</section>
${E}`;
if (html.includes(S)) html = html.slice(0, html.indexOf(S)) + block + html.slice(html.indexOf(E) + E.length);
else html = html.replace('<footer>', block + '\n\n<footer>');
fs.writeFileSync(path.join(ROOT, 'index.html'), html);

console.log('sitemap urls:', indexed.length + 1 + triviaLangs().length);
