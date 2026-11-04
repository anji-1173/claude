// 担当分の検査： node tools/zh_kana_check.mjs 1   （i18n/work/zhfix/in-1.json と out-1.json）
import fs from 'fs';
import path from 'path';
import { ROOT, tagsOf } from './i18n_lib.mjs';
const n = process.argv[2];
const dir = path.join(ROOT, 'i18n', 'work', 'zhfix');
const inp = JSON.parse(fs.readFileSync(path.join(dir, `in-${n}.json`), 'utf8')).items;
const out = JSON.parse(fs.readFileSync(path.join(dir, `out-${n}.json`), 'utf8'));
const kana = /[ぁ-ゖァ-ヺ]/;
let miss = 0, k = 0, tag = 0, empty = 0;
for (const it of inp) {
  const y = out[it.id];
  if (typeof y !== 'string') { miss++; continue; }
  if (!y.trim()) empty++;
  if (kana.test(y)) { k++; if (k < 4) console.log('かな残り:', it.id.split('\t')[0], y.match(/.{0,15}[ぁ-ゖァ-ヺ]+.{0,10}/)[0]); }
  if (tagsOf(it.text).join() !== tagsOf(y).join()) { tag++; if (tag < 4) console.log('タグ違い:', it.id); }
}
console.log(`件数 ${inp.length} / 未訳 ${miss} / 空 ${empty} / かな残り ${k} / タグ違い ${tag}`);
process.exit(miss || empty || k || tag ? 1 : 0);
