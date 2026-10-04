# 沖縄そばブログ — 運用ルール（Claudeへの申し送り帳）

アンジ（沖縄そばブロガー）の、沖縄本島の沖縄そば屋を全店巡るブログ。
このファイルは作業を始めるとき最初に読むこと。毎回のやり方をここに書いておく。

## このプロジェクトについて
- 成果物は「お店のレビュー記事（文章コンテンツ）」。index.html は完成済みの入れ物。
- note.com の別ブログから独立した、単独の静的サイト。**note へのリンク・言及は一切入れない**。
- 私（Claude）は note.com に直接アクセスできない（プロキシ403）。本文はアンジが貼り付けてくれる＝
  1メッセージに複数記事をまとめて受け取り、バッチで処理するのが基本の進め方。

## ファイルとデータ構造（すべて okinawa-soba/index.html の中）
- `const ARTICLES = {…}` … 記事本文。新規は `const ARTICLES = {` の直後に prepend する。
- `const SOBA_SHOPS = […]` … 店カード。JSONとして読める配列（python json load/dump で編集）。
- `const PHOTOS = {…}` … 埋め込み写真マニフェスト（サイトが photoKey で参照）。
- `window.SHOP_GEO_DATA = {…}` … 地図ピン。**必ずオブジェクト形式** `"店名":{"lat":..,"lng":..,"addr":".."}`。
  配列 `[lat,lng]` 形式は initLeaflet が読めず地図が壊れるので使わない。
- 写真は `photos/NNN/01.jpg`（連番）。`photos/manifest.json`（ツール用）と埋め込み `PHOTOS`（サイト用）の**両方**を更新する。

## 記事を追加する手順
1. 店名で在庫確認（manifest.json のフォルダID・SOBA_SHOPS のカード・SHOP_GEO_DATA のピン）。
2. 写真フォルダのコンタクトシートを sharp で作成し、記事の「画像」マーカーと1枚ずつ照合する。
3. 本文を**一字一句そのまま**（要約・改変しない）、写真を正しい順で挿入。星評価・訪問区切りを付与。
4. カードの説明文・地域・タグを更新。地域/ピンをネットで確定（下記ルール）。
5. Playwright で全記事を検証（下記）。
6. 両リポジトリへコミット＆プッシュ → GitHub Pages のビルド成功まで確認。
7. 決まった形式で報告（下記）。
- 挿入は python スクリプト（ARTICLES/geo は文字列操作、SOBA_SHOPS/PHOTOS は json）で行い、
  最後に `node -e "new Function(script)"` で全 `<script>` ブロックを構文チェックする。

## 記事の書式ルール
- 星評価は3行。半星は `✬` を使う。例:
  `麺　　：★★★☆☆（3）` / `スープ：★★★✬☆（3.5）` / `具　　：★★★☆☆（3）`
- 複数回訪問は見出し `― N回目の訪問（YYYY年M月）―`（art-visit）で区切り、**各訪問に星評価**を付ける。
- 記事中に星評価が本文の途中で出てくる場合、その後の締め段落も省かず残す。

## 地図・地域のルール
- 地域・ピンは**自分でネット検索して確定**する。アンジに住所を聞かない・曖昧なピンを残さない。
- 記事に書かれた訪問店舗と、既存カードのピンがずれている場合はピンを訪問店舗に直す。
- 座標の当たりは scratchpad/geo の町丁目セントロイド＋WebSearch で。main の geo データは addr 付きで既に大半をカバー。

## 写真のルール
- AI生成イラスト写真（店舗の絵・街並みの絵など）は**記事に載せない**。見つけたら毎回報告する。
- フォルダが無い新店は、テキストのみの記事＋新カード＋ピンを先に作る。写真はアンジが
  GitHubのWebアップロード（https://github.com/anji-1173/okinawa-soba/upload/main）で上げてくれるので、後から統合する。
- **アップロードページが使えない場合の写真受け取りルート（実績あり）**：
  1. アンジが https://github.com/anji-1173/okinawa-soba/issues/new に写真を貼り付けて Issue を作成
  2. Issue本文から `github.com/user-attachments/assets/…` のURLを抽出（このURLはセッションのプロキシで直接DL不可）
  3. URLをハードコードした一時ワークフロー `.github/workflows/fetch-assets.yml`（workflow_dispatch,
     permissions: contents: write, curlでDL→ `incoming/` にコミット）を main にプッシュし、
     MCPの actions_run_trigger で実行 → git pull で受領
  4. sharpでリサイズ（.rotate()→1200px inside, q78）して photos/NNN/ へ、記事・PHOTOS・manifest を更新
  5. 後片付け：incoming/ とワークフローを git rm し、Issue をクローズする
  ※チャットに貼られた写真は「見える」だけでファイル化できないので、必ずIssue経由で受け取る。
- 記事の「画像」マーカー数より写真が少ない/位置が合わない分は無理に埋めず、未使用として報告する。

## 公開（デプロイ）手順
- 作業リポジトリ: `anji-1173/claude` ブランチ `claude/okinawa-soba-blog-site-s7h78g`
- 公開リポジトリ（GitHub Pages）: `anji-1173/okinawa-soba` ブランチ `main`（pub clone は scratchpad/pub）
- 同じ index.html を両方へプッシュする。push は `-u origin <branch>`、ネットワーク失敗のみ指数バックオフで最大4回リトライ。
- Pages ビルドは `curl .../actions/runs?per_page=1` で status/conclusion を確認。queued/failed で止まったら
  空コミット `git commit --allow-empty` で再トリガー。conclusion=success まで見届ける。

## 検証（デプロイ前に必ず行う）
- Playwright（executablePath: /opt/pw-browsers/chromium、NODE_PATH=/opt/node22/lib/node_modules）で、
  各記事の figure 枚数・順序・キャプション・星ブロック・訪問区切り数・エリア表記・JSエラー0 を確認。
- 地図の circleMarker ピン数（`#leaflet-map path.leaflet-interactive`）が店数とほぼ一致することを確認。
- 記事ページは `#article-view` 内、写真は `figure.art-fig`、本文段落は `.art-body p`。

## やってはいけないこと
- note へのリンク・言及を入れる。
- 本文を要約・改変する。
- 地図ピンを配列形式にする／曖昧なまま残す。
- AI生成イラストを記事写真として使う。
- 診断カード等、ブログと無関係な個人ファイルをこのリポジトリにコミットする。

## 報告フォーマット（作業の最後に日本語で）
追加した記事数 / 修正したピン / 除外したAIイラスト / 未使用写真 / 公開URL とビルド成功、を簡潔にまとめる。
公開URL: https://anji-1173.github.io/okinawa-soba/
