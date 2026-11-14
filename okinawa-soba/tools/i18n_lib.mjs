// 多言語化の共通処理：index.html からデータを読み、翻訳対象（テキスト単位）を取り出す
import fs from 'fs';
import path from 'path';
export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const LANGS = ['en', 'ko', 'zh-TW', 'zh-CN'];

export function readData(html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')) {
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
  return {
    ARTICLES: literalAfter('const ARTICLES = '),
    SHOPS: literalAfter('const SOBA_SHOPS = '),
    PHOTOS: literalAfter('const PHOTOS = '),
    GEO: literalAfter('window.SHOP_GEO_DATA = '),
  };
}

// 星評価ブロックは翻訳せずコードでラベルだけ置き換える
export const isStars = p => typeof p === 'string' && p.includes('class="art-stars"');

// 記事の要素 → 翻訳単位の配列（文字列）。星評価は null。
export function unitsOf(items) {
  return (items || []).map(p => {
    if (typeof p === 'string') return isStars(p) ? null : p;
    if (p && p.html) return p.html;
    if (p && (p.img || p.video)) return p.cap || '';
    return null;
  });
}

// 翻訳単位を記事の要素に戻す
const STAR_LABELS = {
  en: ['Noodles', 'Soup', 'Toppings'], ko: ['면', '수프', '토핑'],
  'zh-TW': ['麵', '湯頭', '配料'], 'zh-CN': ['面', '汤头', '配料'],
};
const STAR_NOTES = { en: ' (*for the fish cake)', ko: ' (※어묵 기준)', 'zh-TW': '（※針對魚板）', 'zh-CN': '（※针对鱼板）' };
export function starsFor(p, lang) {
  const L = STAR_LABELS[lang];
  const colon = lang.startsWith('zh') ? '：' : ': ';
  return p.replace('麺　　：', L[0] + colon).replace('スープ：', L[1] + colon).replace('具　　：', L[2] + colon)
    .replace('（※かまぼこに対して）', STAR_NOTES[lang]);
}
export function rebuild(items, units, lang) {
  return items.map((p, i) => {
    if (typeof p === 'string') return isStars(p) ? starsFor(p, lang) : (units[i] ?? p);
    if (p && p.html) return { html: units[i] ?? p.html };
    if (p && (p.img || p.video)) return { ...p, cap: units[i] ?? p.cap };
    return p;
  });
}
export const tagsOf = s => (String(s).match(/<[^>]+>/g) || []).map(t => t.replace(/\s+/g, ' '));

import crypto from 'crypto';
// 原文が変わったかどうかの目印（記事を直したら再翻訳の対象になる）
export const srcHashOf = e => crypto.createHash('sha1')
  .update(JSON.stringify([e.name, e.area, e.desc, e.rank || '', e.t])).digest('hex').slice(0, 16);
export const srcHash = (s, items) => srcHashOf({ name: s.name, area: s.area, desc: s.desc, rank: s.rank || '', t: unitsOf(items) });

// 翻訳の作業フォルダ
export const WORK = path.join(ROOT, 'i18n', 'work');
export const PARTS = path.join(WORK, 'parts');
export const TODO = path.join(WORK, 'todo');
export const langOf = f => (f.match(/\.(en|ko|zh-TW)\./) || [])[1];
// 全バッチの原文を店名で引けるようにまとめる
export function loadJa() {
  const ja = {};
  for (const f of fs.existsSync(WORK) ? fs.readdirSync(WORK).filter(x => /^batch-\d+\.ja\.json$/.test(x)) : [])
    Object.assign(ja, JSON.parse(fs.readFileSync(path.join(WORK, f), 'utf8')).shops);
  return ja;
}
// parts/*.<lang>.*.json をすべて店名で結合（新しいファイルが古いものを上書き）
export function loadParts(lang, prefix = '') {
  const out = {};
  const files = (fs.existsSync(PARTS) ? fs.readdirSync(PARTS) : [])
    .filter(f => f.endsWith('.json') && langOf(f) === lang && f.startsWith(prefix))
    .map(f => ({ f, m: fs.statSync(path.join(PARTS, f)).mtimeMs })).sort((a, b) => a.m - b.m);
  for (const { f } of files) {
    try { Object.assign(out, JSON.parse(fs.readFileSync(path.join(PARTS, f), 'utf8')).shops); }
    catch (e) { console.log('壊れた part（無視）:', f); }
  }
  return out;
}
