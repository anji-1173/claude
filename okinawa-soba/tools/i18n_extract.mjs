// 新しい記事・直した記事の翻訳元を切り出す： node tools/i18n_extract.mjs
//  - 翻訳がまだ無い店、または原文（記事・紹介文・地域・順位）が変わった店を、i18n/work/batch-NN.ja.json（NN は次の空き番号）に書き出す
//  - 原文が変わった店は、古い訳を part / 保管庫から外す（＝再翻訳の対象になる）
//  続けて:  node tools/i18n_todo.mjs en=1 ko=1 zh-TW=1  →  担当表ごとに翻訳  →  node tools/i18n_build.mjs
import fs from 'fs';
import path from 'path';
import { ROOT, WORK, PARTS, readData, unitsOf, srcHash, loadJa } from './i18n_lib.mjs';
const { ARTICLES, SHOPS } = readData();
const JA = loadJa();
const LANGS = ['en', 'ko', 'zh-TW'];
// 翻訳済みかどうかは、訳の保管庫（i18n/<lang>.json）の「訳した時点の原文の目印(src)」で見る
const stores = Object.fromEntries(LANGS.map(l => {
  const f = path.join(ROOT, 'i18n', `${l}.json`);
  return [l, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).shops : {}];
}));
const entry = s => ({ name: s.name, area: s.area, desc: s.desc, rank: s.rank || '', t: unitsOf(ARTICLES[s.name]) });
const changed = [], fresh = [];
for (const s of SHOPS) {
  const cur = srcHash(s, ARTICLES[s.name]);
  const any = LANGS.some(l => stores[l][s.name]);
  if (!any) fresh.push(s);
  else if (LANGS.some(l => !stores[l][s.name] || stores[l][s.name].src !== cur)) changed.push(s);
}
// 変更のあった店の古い訳を外す
for (const s of changed) {
  for (const f of fs.existsSync(PARTS) ? fs.readdirSync(PARTS) : []) {
    const p = path.join(PARTS, f); let j; try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { continue; }
    if (j.shops && j.shops[s.name]) { delete j.shops[s.name]; fs.writeFileSync(p, JSON.stringify(j)); }
  }
  for (const l of LANGS) { const f = path.join(ROOT, 'i18n', `${l}.json`); if (!fs.existsSync(f)) continue; const j = JSON.parse(fs.readFileSync(f, 'utf8')); delete j.shops[s.name]; fs.writeFileSync(f, JSON.stringify(j, null, 1)); }
}
const list = [...fresh, ...changed];
if (!list.length) { console.log('翻訳が必要な店はありません'); process.exit(0); }
let n = 0; for (const f of fs.readdirSync(WORK)) { const m = f.match(/^batch-(\d+)\.ja\.json$/); if (m) n = Math.max(n, +m[1]); }
const out = path.join(WORK, `batch-${String(n + 1).padStart(2, '0')}.ja.json`);
fs.writeFileSync(out, JSON.stringify({ shops: Object.fromEntries(list.map(s => [s.name, entry(s)])) }, null, 1));
console.log(path.relative(ROOT, out), '新規', fresh.length, '店 / 修正', changed.length, '店');
