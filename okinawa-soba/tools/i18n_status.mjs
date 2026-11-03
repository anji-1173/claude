// 翻訳の進み具合： node tools/i18n_status.mjs   （batch×言語ごとに、訳済み／全体 と 未訳の店名を表示）
import fs from 'fs';
import path from 'path';
import { ROOT } from './i18n_lib.mjs';
const work = path.join(ROOT, 'i18n', 'work'), parts = path.join(work, 'parts');
const langs = ['en', 'ko', 'zh-TW'];
const out = {};
let totalDone = 0, total = 0;
for (const f of fs.readdirSync(work).filter(x => x.endsWith('.ja.json')).sort()) {
  const b = f.match(/batch-(\d+)/)[1];
  const ja = Object.keys(JSON.parse(fs.readFileSync(path.join(work, f), 'utf8')).shops);
  for (const l of langs) {
    const done = new Set();
    for (const pf of fs.existsSync(parts) ? fs.readdirSync(parts) : []) {
      if (!pf.startsWith(`batch-${b}.${l}.`)) continue;
      try { Object.keys(JSON.parse(fs.readFileSync(path.join(parts, pf), 'utf8')).shops).forEach(k => done.add(k)); } catch { console.log('壊れた part:', pf); }
    }
    const missing = ja.filter(k => !done.has(k));
    out[`${b}.${l}`] = missing;
    totalDone += ja.length - missing.length; total += ja.length;
    console.log(`batch-${b} ${l.padEnd(5)} ${ja.length - missing.length}/${ja.length}`);
  }
}
console.log(`合計 ${totalDone}/${total}`);
fs.writeFileSync(path.join(work, 'missing.json'), JSON.stringify(out, null, 1));
