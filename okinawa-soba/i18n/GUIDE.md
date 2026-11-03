# 翻訳ガイド（沖縄そば巡りの旅）

沖縄本島の沖縄そば屋を食べ歩く、日本語の個人ブログ（筆者：アンジ）の翻訳。読者は沖縄を訪れる観光客。

## ファイル（担当分けの流れ）
- 原文: `i18n/work/todo/todo-N.<lang>.ja.json` … `{"shops": {"<店名(日本語)>": {name, area, desc, rank, t:[…]}}}`（N は担当番号。**ここにある店がすべてあなたの担当**）
- 訳文: `i18n/work/parts/todo-N.<lang>.pK.json`（K=1,2,3…）… 中身は `{"shops": {…}}`。**キーは日本語の店名のまま**、値だけ訳す。
  - `name`: 店名の訳、`area`: 地名の訳、`desc`: 紹介文の訳、`rank`: 順位表記の訳（空文字は空のまま）
  - `t`: 記事本文の配列。**要素数・順番は原文と同じ**。`null` は `null` のまま。空文字は空のまま。
  - 1ファイル5店ほどずつ書く（長いので小分けにする）。
- 検査: `node tools/i18n_check.mjs todo-N.<lang>` が `OK` になるまで直す（未訳の店・タグ違い・個数違いを検出する）。
  「かなが残っている」注意は、店名・料理名などを訳し忘れていないか確認する（英語・韓国語では日本語のかなを残さない）。
- すでに訳したものは再翻訳しない。途中で止まったら、`node tools/i18n_check.mjs todo-N.<lang>` の「訳が無い」店だけ続きを書く。

## 訳し方
- 原文に**忠実に全文**訳す（要約・省略・追加をしない）。親しみやすい食べ歩きブログの口調（一人称）。
- 絵文字・顔文字（😄 🍜 ^^; など）は**そのまま残す**。
- **HTMLタグ（`<br>` `<b>` `<h2 class="...">` など）は原文と同じものを同じ順番で残し**、タグの中の文字だけ訳す。
- 値段: 900円 → en「¥900」/ ko「900엔」/ zh-TW「900日圓」。1,100円 → ¥1,100 など。
- 時期: 「2025.7に食べました」→ en「I ate here in July 2025」/ ko「2025년 7월에 먹었습니다」/ zh-TW「2025年7月吃的」。
- 評価: 「評価（9点/15点）：」→ en「Rating (9/15):」/ ko「평가(9점/15점):」/ zh-TW「評分（9分/15分）：」。半点(9.5点)も同様。
- 順位(rank): 「暫定1位」→ en「Provisional #1」/ ko「잠정 1위」/ zh-TW「暫定第1名」。「同点暫定1位」→「Tied provisional #1」/「동점 잠정 1위」/「並列暫定第1名」。
- 写真キャプション（例「くんちそば　900円」「お店の外観」「券売機」）も訳す。

## 店名・地名
- en: 日本語の読みをヘボン式ローマ字で（例: そば処くんち → Soba-dokoro Kunchi、宮里そば → Miyazato Soba、食堂 → Shokudo）。
  アルファベットの店名（EIBUN, SHIKAKU など）はそのまま。読みが不確かな漢字は最も一般的な読みにする。
- ko: 日本語の読みをハングルで音訳（例: そば処くんち → 소바도코로 쿤치、宮里そば → 미야자토 소바）。アルファベット店名はそのまま。
- zh-TW: 店名は**原文の表記のまま**（かな・漢字とも変えない）。
- 本文中に出てくる店名も、その言語の店名表記にそろえる（同じバッチ内で一貫させる）。
- 地名(area): en「Shuri Torihori-cho, Naha」/ ko「나하시 슈리 도리호리초」/ zh-TW「那霸市首里鳥堀町」のように。「—」はそのまま。

## 沖縄そば用語（必ずこの訳を使う）
| 日本語 | en | ko | zh-TW |
|---|---|---|---|
| 沖縄そば | Okinawa soba | 오키나와 소바 | 沖繩麵 |
| そば（単独） | soba（小麦麺。buckwheat と書かない） | 소바 | 麵（「蕎麥」と書かない） |
| そば屋 | soba shop | 소바 가게 | 沖繩麵店 |
| ソーキそば | soki soba | 소키 소바 | 排骨麵（ソーキそば） |
| 本ソーキ | bone-in pork ribs (hon-soki) | 뼈 있는 돼지갈비(혼소키) | 帶骨排骨（本ソーキ） |
| 軟骨ソーキ | soft-bone pork ribs (nankotsu soki) | 연골 돼지갈비(난코츠 소키) | 軟骨排骨 |
| ソーキ | pork spare ribs (soki) | 돼지갈비(소키) | 排骨 |
| 三枚肉 | braised pork belly (sanmai-niku) | 삼겹살 조림(산마이니쿠) | 三層肉 |
| てびち / テビチ | pig's feet (tebichi) | 돼지족(테비치) | 豬腳 |
| じゅーしー / ジューシー | jushi (Okinawan seasoned rice) | 주시(오키나와식 영양밥) | 沖繩炊飯（Jushi） |
| コーレーグース | kōrēgūsu (chili-infused awamori) | 코레구스(고추 아와모리) | 島辣椒泡盛 |
| 紅生姜 | pickled red ginger | 붉은 생강 초절임 | 紅薑 |
| かまぼこ | fish cake (kamaboko) | 어묵(가마보코) | 魚板 |
| 中身（汁） | pork offal (nakami) | 돼지 내장(나카미) | 豬內臟 |
| ゆし豆腐 | yushi-dofu (soft Okinawan tofu) | 유시두부(오키나와 순두부) | 沖繩嫩豆腐 |
| 島豆腐 | Okinawan firm tofu (shima-dofu) | 시마두부 | 沖繩島豆腐 |
| アーサ | sea lettuce (āsa) | 파래(아사) | 石蓴 |
| ちゃんぷるー | champuru (Okinawan stir-fry) | 참프루(오키나와식 볶음) | 什錦炒（Champuru） |
| ゴーヤー | bitter melon (goya) | 여주(고야) | 苦瓜 |
| 泡盛 | awamori | 아와모리 | 泡盛 |
| 三線 / 歌三線 | sanshin / singing with the sanshin | 산신 / 산신 연주와 노래 | 三線 / 三線彈唱 |
| 木灰そば | mokkai soba (made with wood-ash lye) | 목회 소바(나무재 잿물 면) | 木灰麵 |
| 鰹出汁 / 豚骨 | bonito broth / pork bone | 가쓰오 육수 / 돼지뼈 | 柴魚高湯 / 豬骨 |
| 筋感 | sinewy texture | 힘줄 같은 질긴 식감 | 筋感（口感偏韌） |
| 歯応え | chewiness / bite | 씹는 맛 | 嚼勁 |
| 券売機 | ticket machine | 식권 발매기 | 售票機 |
| 着丼 | the bowl arrives | 소바가 나왔다 | 上桌 |
| 麺リフト | noodle lift | 면 리프트 | 麵條特寫 |
| お邪魔してきました | visited | 다녀왔습니다 | 造訪了 |
| のれん | noren (shop curtain) | 노렌(가게 천 간판) | 暖簾 |
| 〜さん（店に付く） | 訳さない | 訳さない | 訳さない |
- 「（3）」のような星の数字や ★☆✬ はそのまま。
