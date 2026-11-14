// 直した文を、繁体字の訳（parts）に書き戻す： node tools/zh_kana_apply.mjs
import fs from 'fs';
import path from 'path';
import { ROOT, PARTS, langOf } from './i18n_lib.mjs';
const dir = path.join(ROOT, 'i18n', 'work', 'zhfix');
const fix = {};
for (const f of fs.readdirSync(dir).filter(x => /^out-\d+\.json$/.test(x))) Object.assign(fix, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
let n = 0;
for (const f of fs.readdirSync(PARTS).filter(x => x.endsWith('.json') && langOf(x) === 'zh-TW')) {
  const p = path.join(PARTS, f); const j = JSON.parse(fs.readFileSync(p, 'utf8')); let ch = false;
  for (const [k, v] of Object.entries(j.shops)) {
    for (const fld of ['name', 'area', 'desc']) { const id = `${k}\t${fld}`; if (fix[id] != null) { v[fld] = fix[id]; ch = true; n++; } }
    v.t = v.t.map((s, i) => { const id = `${k}\tt\t${i}`; if (fix[id] != null) { ch = true; n++; return fix[id]; } return s; });
  }
  if (ch) fs.writeFileSync(p, JSON.stringify(j));
}
console.log('書き戻し', n, '件');
