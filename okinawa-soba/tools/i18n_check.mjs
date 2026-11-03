// 翻訳の検査
//   node tools/i18n_check.mjs todo-3.en   … work/todo/todo-3.en.ja.json（担当分）と parts/todo-3.en.p*.json を照合（未訳の店も検出）
//   node tools/i18n_check.mjs --all       … すべての part を全原文と照合（誤りだけ表示）
import fs from 'fs';
import path from 'path';
import { tagsOf, TODO, PARTS, loadJa, loadParts, langOf } from './i18n_lib.mjs';
const arg = process.argv[2];
const kana = /[\u3041-\u3096\u30A1-\u30FA]/;
let err = 0, warn = 0;
const E = m => { err++; console.log('ERROR', m); }, W = m => { warn++; if (warn < 40) console.log('warn ', m); };

function checkShop(k, a, b, lang) {
  for (const fld of ['name', 'area', 'desc', 'rank']) if (typeof b[fld] !== 'string') E(`${k}: ${fld} が無い`);
  if (!Array.isArray(b.t) || b.t.length !== a.t.length) { E(`${k}: t の個数が違う (${b.t && b.t.length} / ${a.t.length})`); return; }
  a.t.forEach((x, i) => {
    const y = b.t[i];
    if (x === null) { if (y !== null) E(`${k}[${i}]: null のままにする`); return; }
    if (typeof y !== 'string') { E(`${k}[${i}]: 文字列でない`); return; }
    if (x.trim() && !y.trim()) E(`${k}[${i}]: 空`);
    if (tagsOf(x).join() !== tagsOf(y).join()) E(`${k}[${i}]: HTMLタグが原文と違う ${tagsOf(x).join('')} → ${tagsOf(y).join('')}`);
    if (x === y && kana.test(x) && !(lang === 'zh-TW' && x.length <= 16)) E(`${k}[${i}]: 未翻訳`); // 繁体字は店名などそのままで良い
    if ((lang === 'en' || lang === 'ko') && kana.test(y)) W(`${k}[${i}]: かなが残っている: ${y.match(/[\u3041-\u3096\u30A1-\u30FA]+/)[0]}`);
  });
  if (a.desc.trim() && !b.desc.trim()) E(`${k}: desc が空`);
  if ((lang === 'en' || lang === 'ko') && kana.test(b.desc)) W(`${k}: desc にかな`);
}

if (arg === '--all') {
  const ja = loadJa();
  for (const lang of ['en', 'ko', 'zh-TW']) {
    const tr = loadParts(lang);
    for (const k of Object.keys(tr)) { if (!ja[k]) { W(`[${lang}] ${k}: 原文に無い店`); continue; } checkShop(`[${lang}] ${k}`, ja[k], tr[k], lang); }
    const miss = Object.keys(ja).filter(k => !tr[k]).length;
    console.log(`${lang}: ${Object.keys(tr).length} 店 訳済み / 未訳 ${miss}`);
  }
} else {
  const lang = langOf(arg + '.');
  const src = JSON.parse(fs.readFileSync(path.join(TODO, `${arg}.ja.json`), 'utf8')).shops;
  const tr = loadParts(lang); // 担当外の part（復元分など）に訳があっても「訳済み」と数える
  for (const k of Object.keys(src)) { if (!tr[k]) { E(`${k}: 訳が無い`); continue; } checkShop(k, src[k], tr[k], lang); }
  console.log(err ? `NG: エラー ${err} 件` : `OK (${Object.keys(src).length} 店)`, warn ? `/ 注意 ${warn} 件` : '');
  process.exit(err ? 1 : 0);
}
console.log(err ? `NG: エラー ${err} 件` : 'OK', warn ? `/ 注意 ${warn} 件` : '');
process.exit(err ? 1 : 0);
