// 繁体字の店名を中国語にそろえる： node tools/zh_apply_names.mjs
//  1) i18n/work/zhnames/out-*.json（{日本語の店名: 中国語の店名}）を i18n/zh-names.json にまとめる
//  2) zh-TW の訳（parts/*.zh-TW.*.json）の name を中国語の店名にし、紹介文・本文に出てくる日本語の店名も中国語の店名に置き換える
import fs from 'fs';
import path from 'path';
import { ROOT, PARTS, langOf, readData } from './i18n_lib.mjs';
const kana = /[ぁ-ゖァ-ヺ]/;
const { SHOPS } = readData();
const dir = path.join(ROOT, 'i18n', 'work', 'zhnames');
const mapFile = path.join(ROOT, 'i18n', 'zh-names.json');
const map = fs.existsSync(mapFile) ? JSON.parse(fs.readFileSync(mapFile, 'utf8')) : {};
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter(x => /^out-\d+\.json$/.test(x)) : []) Object.assign(map, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const miss = SHOPS.filter(s => !map[s.name]).map(s => s.name);
const bad = Object.entries(map).filter(([k, v]) => kana.test(v) || !v.trim());
const vals = Object.values(map), dups = vals.filter((v, i) => vals.indexOf(v) !== i);
console.log('店名', Object.keys(map).length, '/ 未設定', miss.length, '/ かな残り', bad.length, '/ 重複', dups.length);
if (miss.length || bad.length || dups.length) { console.log({ miss: miss.slice(0, 10), bad: bad.slice(0, 10), dups: dups.slice(0, 10) }); process.exit(1); }
fs.writeFileSync(mapFile, JSON.stringify(map, null, 1));

// 置き換えの組（長い名前を先に）
const pairs = new Map();
const full = new Set(Object.keys(map));
for (const [ja, zh] of Object.entries(map)) {
  pairs.set(ja, zh);
  const nos = ja.replace(/[\s　]+/g, '');
  if (nos !== ja && !full.has(nos)) pairs.set(nos, zh.replace(/[\s　]+/g, ' '));
  const mj = ja.match(/^(.+?)（(.+?)）$/), mz = zh.match(/^(.+?)（(.+?)）$/);
  if (mj && !full.has(mj[1])) pairs.set(mj[1], mz ? mz[1] : zh);
}
const keys = [...pairs.keys()].sort((a, b) => b.length - a.length);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 1〜2文字の名前（「和」など）は、普通の語と区別できないので「」『』で囲まれているときだけ置き換える
const longKeys = keys.filter(k => k.length >= 3), shortKeys = keys.filter(k => k.length < 3);
const reLong = new RegExp(longKeys.map(esc).join('|'), 'g');
const reShort = shortKeys.length ? new RegExp('([「『“])(' + shortKeys.map(esc).join('|') + ')([」』”])', 'g') : null;
let replaced = 0;
const rep = s => {
  if (typeof s !== 'string') return s;
  let r = s.replace(reLong, m => { replaced++; return pairs.get(m); });
  if (reShort) r = r.replace(reShort, (m, a, k, c) => { replaced++; return a + pairs.get(k) + c; });
  return r;
};
let files = 0, shops = 0;
for (const f of fs.readdirSync(PARTS).filter(x => x.endsWith('.json') && langOf(x) === 'zh-TW')) {
  const p = path.join(PARTS, f); const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const [k, v] of Object.entries(j.shops)) {
    if (!map[k]) continue;
    v.name = map[k]; v.desc = rep(v.desc); v.area = rep(v.area); v.rank = rep(v.rank || '');
    v.t = v.t.map(x => rep(x));
    shops++;
  }
  fs.writeFileSync(p, JSON.stringify(j)); files++;
}
console.log('更新:', files, 'ファイル /', shops, '店 / 置き換え', replaced, '回');
