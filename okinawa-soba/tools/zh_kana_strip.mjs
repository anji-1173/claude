// 中国語の訳に付いた「（日本語の読み・原文）」の括弧書きを外す： node tools/zh_kana_strip.mjs
// 例: 帶骨排骨（本ソーキ）麵 → 帶骨排骨麵。括弧の中にかなを含むものだけが対象（HTMLタグの中は触らない）
import fs from 'fs';
import path from 'path';
import { PARTS, langOf } from './i18n_lib.mjs';
const kana = /[ぁ-ゖァ-ヺ]/;
const paren = /[（(][^（）()<>]*[ぁ-ゖァ-ヺ][^（）()<>]*[）)]/g;
const strip = s => (typeof s === 'string' && kana.test(s)) ? s.replace(paren, '') : s;
let n = 0;
for (const f of fs.readdirSync(PARTS).filter(x => x.endsWith('.json') && langOf(x) === 'zh-TW')) {
  const p = path.join(PARTS, f); const j = JSON.parse(fs.readFileSync(p, 'utf8')); let ch = false;
  for (const v of Object.values(j.shops)) {
    for (const fld of ['name', 'area', 'desc']) { const r = strip(v[fld]); if (r !== v[fld]) { v[fld] = r; ch = true; n++; } }
    v.t = v.t.map(s => { const r = strip(s); if (r !== s) { ch = true; n++; } return r; });
  }
  if (ch) fs.writeFileSync(p, JSON.stringify(j));
}
console.log('括弧書きを外した文:', n);
