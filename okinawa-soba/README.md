# アンジの沖縄そば巡りの旅 — ブログサイト

note（ https://note.com/anjiijna ）で連載中の「沖縄そば巡りの旅」をもとにした、
アンジ専用の沖縄そばブログサイトです。

- `index.html` … サイト本体（1ファイル完結・そのままブラウザで開けます）
- GitHub Pages を有効にすると `https://<ユーザー名>.github.io/<リポジトリ名>/okinawa-soba/` で公開できます

## 写真の入れ方

今はカードに「そば鉢のイラスト」が仮で表示されています。
`E:\ノート（素材）\沖縄そば` の写真を使うには：

1. この `okinawa-soba` フォルダの中に `photos` フォルダを作り、写真をコピーする
   （例：`okinawa-soba/photos/eibun.jpg`）
2. `index.html` 内の `SOBA_SHOPS` データで、そのお店の `photo:null` を
   `photo:"photos/eibun.jpg"` のように書き換える

これだけでカードの画像が写真に切り替わります。

## お店の追加・編集

`index.html` の `SOBA_SHOPS` 配列に1ブロック追加するだけです。

```js
{name:"店名", area:"市町村", region:"naha|south|central|north|other",
 tags:["オススメ"], desc:"紹介文", url:"noteの記事URL", photo:null},
```

## メモ

- 各カードの紹介文は note記事のタイトル・要約をもとにした短い引用ダイジェストです。
  全文は各カードの「noteで読む」リンクから note へ飛べます。
- 記事の全文をサイトに載せたい場合は、note の本文を貼っていただければ
  記事ページを追加できます。
