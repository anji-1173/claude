// 使い方: NODE_PATH=/opt/node22/lib/node_modules node verify_article.js <index.htmlを配信するhttp://host:port> <店名> [<店名2> ...]
// 記事1件（または複数）の figure/star/gallery/JSエラーをまとめて検証する。
// 事前に対象ディレクトリで `python3 -m http.server <port>` を立てておくこと。
const { chromium } = require("playwright");

async function main() {
  const [, , base, ...names] = process.argv;
  if (!base || names.length === 0) {
    console.error("usage: node verify_article.js <http://localhost:PORT/index.html> <店名...>");
    process.exit(1);
  }
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const bad = [];
  page.on("response", (r) => {
    if (r.status() >= 400) bad.push(r.status() + " " + r.url());
  });

  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  for (const name of names) {
    const card = await page.evaluate((n) => {
      const c = [...document.querySelectorAll(".card")].find((x) => {
        const t = x.querySelector("h3,.card-title,h2");
        return t && t.textContent.trim() === n;
      });
      return c ? c.querySelector("img")?.getAttribute("src") || "no-img" : "NO CARD";
    }, name);

    await page.evaluate((n) => {
      location.hash = "#shop/" + n;
    }, name);
    await page.waitForTimeout(800);

    const art = await page.evaluate(() => {
      const v = document.querySelector("#article-view");
      return {
        title: v.querySelector("h1")?.textContent,
        hero: document.querySelector("#art-hero-img")?.getAttribute("src"),
        figs: [...v.querySelectorAll("figure.art-fig img")].map((i) => i.getAttribute("src")),
        caps: [...v.querySelectorAll("figure.art-fig figcaption")].map((c) => c.textContent),
        visits: v.querySelectorAll(".art-visit").length,
        stars: [...v.querySelectorAll(".art-stars")].map((s) => s.textContent),
        gallery: document.querySelectorAll("#art-gallery img").length,
        area: v.querySelector(".art-meta .area")?.textContent,
      };
    });

    console.log("=== " + name);
    console.log("card thumbnail:", card);
    console.log(JSON.stringify(art, null, 1));
  }

  // 地図ピン数（トップに戻ってから数える）
  await page.evaluate(() => {
    location.hash = "";
  });
  await page.waitForTimeout(1800);
  const mapInfo = await page.evaluate(() => ({
    shops: typeof SOBA_SHOPS !== "undefined" ? SOBA_SHOPS.length : null,
    pins: document.querySelectorAll("#leaflet-map path.leaflet-interactive").length,
  }));
  console.log("=== map:", JSON.stringify(mapInfo));

  console.log("=== pageerrors:", errors);
  console.log("=== bad responses (tile除く):", bad.filter((u) => !u.includes("tile")));

  await browser.close();
}

main();
