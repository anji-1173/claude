// 分割して書いた翻訳をまとめる： node tools/i18n_join.mjs 01 en
// i18n/work/parts/batch-01.en.*.json（それぞれ {"shops":{...}}）を i18n/work/batch-01.en.json に結合する
import fs from 'fs';
import path from 'path';
import { ROOT } from './i18n_lib.mjs';
const [b, lang] = process.argv.slice(2);
const dir = path.join(ROOT, 'i18n', 'work', 'parts');
const files = fs.readdirSync(dir).filter(f => f.startsWith(`batch-${b}.${lang}.`) && f.endsWith('.json')).sort();
const shops = {};
for (const f of files) Object.assign(shops, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).shops);
const out = path.join(ROOT, 'i18n', 'work', `batch-${b}.${lang}.json`);
fs.writeFileSync(out, JSON.stringify({ shops }, null, 1));
console.log(files.length, 'parts ->', path.relative(ROOT, out), Object.keys(shops).length, 'shops');
