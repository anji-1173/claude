// 使い方: node make_contact_sheet.js <photos/NNNのパス> <出力先png/jpgパス>
// フォルダ内の 01.jpg, 02.jpg... を連番ラベル付きで並べたコンタクトシートを作る。
// 写真の内容を1枚ずつ目視確認し、記事の「画像」マーカーと照合するのに使う。
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function main() {
  const [, , srcDir, outPath] = process.argv;
  if (!srcDir || !outPath) {
    console.error("usage: node make_contact_sheet.js <photos/NNN dir> <out.jpg>");
    process.exit(1);
  }
  const files = fs
    .readdirSync(srcDir)
    .filter((f) => /^\d+\.(jpe?g|png)$/i.test(f))
    .sort();
  if (files.length === 0) {
    console.error("画像が見つかりません: " + srcDir);
    process.exit(1);
  }
  const COLS = Math.min(6, files.length);
  const CW = 260;
  const CH = 245;
  const LABEL_H = 26;
  const rows = Math.ceil(files.length / COLS);
  const comps = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * CW;
    const y = row * (CH + LABEL_H);
    const label = Buffer.from(
      `<svg width="${CW}" height="${LABEL_H}"><text x="4" y="19" font-size="17" fill="yellow" font-family="sans-serif">${path.parse(f).name}</text></svg>`
    );
    const labelPng = await sharp({
      create: { width: CW, height: LABEL_H, channels: 3, background: "#000" },
    })
      .composite([{ input: label, left: 0, top: 0 }])
      .png()
      .toBuffer();
    comps.push({ input: labelPng, left: x, top: y });
    const thumb = await sharp(path.join(srcDir, f))
      .rotate()
      .resize({ width: CW - 10, height: CH - 15, fit: "inside" })
      .toBuffer();
    comps.push({ input: thumb, left: x + 5, top: y + LABEL_H + 2 });
  }
  await sharp({
    create: {
      width: COLS * CW,
      height: rows * (CH + LABEL_H),
      channels: 3,
      background: "#111",
    },
  })
    .composite(comps)
    .jpeg({ quality: 85 })
    .toFile(outPath);
  console.log(`done: ${files.length} images -> ${outPath}`);
}

main();
