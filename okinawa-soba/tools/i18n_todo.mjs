// 未訳の店を、言語ごとに担当分けして切り出す： node tools/i18n_todo.mjs en=2 ko=4 zh-TW=5
// → i18n/work/todo/todo-<n>.<lang>.ja.json （n は通し番号）
import fs from 'fs';
import path from 'path';
import { TODO, PARTS, loadJa, loadParts } from './i18n_lib.mjs';
const want = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')).map(([l, n]) => [l, +n]));
const ja = loadJa();
fs.mkdirSync(TODO, { recursive: true });
let n = 0;
for (const d of [TODO, PARTS]) for (const f of fs.existsSync(d) ? fs.readdirSync(d) : []) { const m = f.match(/^todo-(\d+)\./); if (m) n = Math.max(n, +m[1]); }
for (const f of fs.readdirSync(TODO)) fs.rmSync(path.join(TODO, f)); // 古い担当表は捨てる（訳済みの part は残る）
for (const [lang, k] of Object.entries(want)) {
  const done = loadParts(lang);
  const todo = Object.keys(ja).filter(s => !done[s]);
  const size = s => JSON.stringify(ja[s]).length;
  const target = todo.reduce((a, s) => a + size(s), 0) / k;
  let chunk = [], acc = 0; const chunks = [];
  for (const s of todo) { chunk.push(s); acc += size(s); if (acc >= target && chunks.length < k - 1) { chunks.push(chunk); chunk = []; acc = 0; } }
  if (chunk.length) chunks.push(chunk);
  for (const c of chunks) {
    n++;
    const f = path.join(TODO, `todo-${n}.${lang}.ja.json`);
    fs.writeFileSync(f, JSON.stringify({ shops: Object.fromEntries(c.map(s => [s, ja[s]])) }, null, 1));
    console.log(`todo-${n}.${lang}`, c.length, '店', c.reduce((a, s) => a + size(s), 0), '文字');
  }
}
