// 緊急用：i18n/<lang>.js（作成済みの表示用データ）から、parts に無い店の訳を復元する
//   node tools/i18n_restore.mjs
import fs from 'fs';
import path from 'path';
import { ROOT, PARTS, readData, isStars, loadParts } from './i18n_lib.mjs';
const { ARTICLES } = readData();
for (const lang of ['en', 'ko', 'zh-TW']) {
  const f = path.join(ROOT, 'i18n', `${lang}.js`);
  const src = fs.readFileSync(f, 'utf8');
  const I = JSON.parse(src.slice(src.indexOf('window.I18N=') + 12).replace(/;\s*$/, ''));
  const have = loadParts(lang);
  const out = {};
  for (const [k, v] of Object.entries(I.shops)) {
    if (have[k] || !v.art || !ARTICLES[k]) continue;
    const t = ARTICLES[k].map((it, i) => {
      const a = v.art[i];
      if (typeof it === 'string') return isStars(it) ? null : a;
      if (it && it.html) return a.html;
      if (it && (it.img || it.video)) return a.cap;
      return null;
    });
    out[k] = { name: v.name, area: v.area, desc: v.desc, rank: v.rank || '', t };
  }
  fs.mkdirSync(PARTS, { recursive: true });
  const n = Object.keys(out).length;
  if (n) fs.writeFileSync(path.join(PARTS, `restore.${lang}.p1.json`), JSON.stringify({ shops: out }));
  console.log(lang, '復元', n, '店');
}
