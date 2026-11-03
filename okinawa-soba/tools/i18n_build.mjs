// 翻訳をまとめて、サイトが読む i18n/<lang>.js を作る： node tools/i18n_build.mjs
//  1) i18n/work/parts/*.<lang>.*.json（訳した分）を、店名で i18n/<lang>.json（訳の保管庫）に取り込む
//  2) 簡体字(zh-CN)は繁体字(zh-TW)から自動変換（opencc-js。未インストールなら: cd tools && npm i）
//  3) i18n/<lang>.js（window.I18N = {lang, ui, shops}）と i18n/ui-ja.js を書き出す
// 原文（日本語）が変わった店は、訳が古いので「記事本文だけ日本語」で表示される → i18n_todo.mjs で再翻訳する
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { ROOT, readData, rebuild, srcHash, srcHashOf, loadJa, loadParts } from './i18n_lib.mjs';
const require = createRequire(import.meta.url);
const OpenCC = require('opencc-js');
const tw2cn = OpenCC.Converter({ from: 'tw', to: 'cn' });

const { ARTICLES, SHOPS } = readData();
const byName = Object.fromEntries(SHOPS.map(s => [s.name, s]));
const UI = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'ui.json'), 'utf8'));
const JA = loadJa(); // 翻訳に出した時点の原文

function store(lang) {
  const f = path.join(ROOT, 'i18n', `${lang}.json`);
  const st = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { shops: {} };
  const parts = loadParts(lang);
  for (const k of Object.keys(parts)) {
    if (!byName[k] || !JA[k]) continue;
    st.shops[k] = { ...parts[k], src: srcHashOf(JA[k]) }; // 訳した時点の原文の目印
  }
  for (const k of Object.keys(st.shops)) if (!byName[k]) delete st.shops[k]; // 消えた店
  fs.writeFileSync(f, JSON.stringify(st, null, 1));
  return st;
}

function runtime(lang, st, conv = x => x) {
  const shops = {};
  let fresh = 0, stale = 0;
  for (const s of SHOPS) {
    const t = st.shops[s.name];
    if (!t) continue;
    const ok = t.src === srcHash(s, ARTICLES[s.name]);
    ok ? fresh++ : stale++;
    const c = v => (typeof v === 'string' ? conv(v) : v);
    shops[s.name] = {
      name: c(t.name), area: c(t.area), desc: c(t.desc), rank: c(t.rank || ''),
      // 原文が変わって訳が古い場合は記事本文だけ日本語に戻す（名前・紹介文は旧訳のまま）
      art: ok && ARTICLES[s.name] ? rebuild(ARTICLES[s.name], t.t.map(c), lang) : null,
    };
  }
  const ui = lang === 'zh-CN'
    ? Object.fromEntries(Object.entries(UI['zh-TW']).map(([k, v]) => [k, conv(v)]))
    : UI[lang];
  if (lang === 'zh-CN') { ui.lang_name = '简体中文'; ui.lang_btn = '简体中文'; }
  fs.writeFileSync(path.join(ROOT, 'i18n', `${lang}.js`),
    '// 自動生成（tools/i18n_build.mjs）。手で編集しない\nwindow.I18N=' + JSON.stringify({ lang, ui, shops }) + ';\n');
  console.log(lang, '店', Object.keys(shops).length, '/', SHOPS.length, '（最新', fresh, '/ 原文変更あり', stale, '）');
}

for (const lang of ['en', 'ko', 'zh-TW']) runtime(lang, store(lang));
runtime('zh-CN', JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'zh-TW.json'), 'utf8')), tw2cn);
fs.writeFileSync(path.join(ROOT, 'i18n', 'ui-ja.js'), '// 自動生成\nwindow.I18N_JA=' + JSON.stringify(UI.ja) + ';\n');
