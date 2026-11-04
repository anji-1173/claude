// 繁体字の訳に残っている日本語（かな）を含む文を、担当ごとに切り出す： node tools/zh_kana_extract.mjs 4
//  → i18n/work/zhfix/in-N.json  {items:[{id:"店名\tフィールド\t番号", text}]}
import fs from 'fs';
import path from 'path';
import { ROOT, loadParts } from './i18n_lib.mjs';
const n = +(process.argv[2] || 4);
const kana = /[ぁ-ゖァ-ヺ]/;
const tr = loadParts('zh-TW');
const items = [];
for (const [k, v] of Object.entries(tr)) {
  for (const f of ['name', 'area', 'desc']) if (kana.test(v[f] || '')) items.push({ id: `${k}\t${f}`, text: v[f] });
  v.t.forEach((s, i) => { if (typeof s === 'string' && kana.test(s.replace(/<[^>]+>/g, ''))) items.push({ id: `${k}\tt\t${i}`, text: s }); });
}
const dir = path.join(ROOT, 'i18n', 'work', 'zhfix'); fs.mkdirSync(dir, { recursive: true });
for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));
const total = items.reduce((a, x) => a + x.text.length, 0), per = total / n;
let acc = 0, c = 1, chunk = [];
const flush = () => { if (chunk.length) { fs.writeFileSync(path.join(dir, `in-${c}.json`), JSON.stringify({ items: chunk }, null, 1)); console.log(`in-${c}`, chunk.length, '件', chunk.reduce((a, x) => a + x.text.length, 0), '文字'); c++; chunk = []; acc = 0; } };
for (const it of items) { chunk.push(it); acc += it.text.length; if (acc >= per && c < n) flush(); }
flush();
console.log('合計', items.length, '件', total, '文字');
