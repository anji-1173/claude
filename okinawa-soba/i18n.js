// 沖縄そば巡りの旅 — 多言語表示（Google翻訳＋沖縄そば用語集）
// ・画面右下の「🌐」ボタンで 日本語 / English / 한국어 / 繁體中文 / 简体中文 を切り替える。
// ・ページ全体は Google 翻訳で訳すが、沖縄そばの専門用語は下の用語集の訳に差し替え、
//   その訳語を日本語の文中に埋め込んでから Google に訳させる。変な訳（そば→蕎麦、筋感→muscle feeling 等）を防ぐ。
// ・用語集に言葉を足すときは GLOSSARY に1行追加するだけでよい（長い言葉が優先される）。
(function () {
  'use strict';
  var LANGS = [
    { code: 'ja', label: '日本語' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'zh-CN', label: '简体中文' }
  ];
  // [日本語の表記（| 区切りで表記ゆれ）, 英語, 韓国語, 繁体字, 簡体字]
  var GLOSSARY = [
    ['沖縄そば', 'Okinawa soba', '오키나와 소바', '沖繩麵', '冲绳面'],
    ['宮古そば', 'Miyako soba', '미야코 소바', '宮古麵', '宫古面'],
    ['八重山そば', 'Yaeyama soba', '야에야마 소바', '八重山麵', '八重山面'],
    ['木灰そば', 'mokkai soba (noodles made with wood-ash lye)', '목회 소바(나무재 잿물로 만든 면)', '木灰麵（以木灰水製麵）', '木灰面（以木灰水制面）'],
    ['本ソーキそば', 'hon-soki soba (noodle soup with bone-in pork ribs)', '혼소키 소바(뼈 있는 돼지갈비 소바)', '帶骨排骨沖繩麵', '带骨排骨冲绳面'],
    ['軟骨ソーキそば|なんこつソーキそば', 'nankotsu-soki soba (noodle soup with soft-bone pork ribs)', '난코츠소키 소바(연골 돼지갈비 소바)', '軟骨排骨沖繩麵', '软骨排骨冲绳面'],
    ['ソーキそば', 'soki soba (noodle soup with pork spare ribs)', '소키 소바(돼지갈비 소바)', '排骨沖繩麵', '排骨冲绳面'],
    ['てびちそば|テビチそば', 'tebichi soba (noodle soup with pig\'s feet)', '테비치 소바(돼지족 소바)', '豬腳沖繩麵', '猪脚冲绳面'],
    ['三枚肉そば', 'sanmai-niku soba (noodle soup with pork belly)', '산마이니쿠 소바(삼겹살 소바)', '三層肉沖繩麵', '五花肉冲绳面'],
    ['アーサそば|あーさそば', 'āsa soba (noodle soup with sea lettuce)', '아사 소바(파래 소바)', '石蓴沖繩麵', '石莼冲绳面'],
    ['ゆし豆腐そば|ゆしどうふそば', 'yushi-dofu soba (noodle soup with soft tofu)', '유시두부 소바(순두부 소바)', '嫩豆腐沖繩麵', '嫩豆腐冲绳面'],
    ['本ソーキ', 'hon-soki (bone-in pork spare ribs)', '혼소키(뼈 있는 돼지갈비)', '帶骨排骨', '带骨排骨'],
    ['軟骨ソーキ|なんこつソーキ', 'nankotsu-soki (soft-bone pork ribs)', '난코츠소키(연골 돼지갈비)', '軟骨排骨', '软骨排骨'],
    ['ソーキ', 'soki (pork spare ribs)', '소키(돼지갈비)', '排骨', '排骨'],
    ['三枚肉', 'sanmai-niku (braised pork belly)', '산마이니쿠(삼겹살 조림)', '三層肉', '五花肉'],
    ['てびち|テビチ|てぃびち', 'tebichi (braised pig\'s feet)', '테비치(돼지족 조림)', '豬腳', '猪脚'],
    ['じゅーしー|ジューシー|じゅうしい|じゅうしぃ|ジューシィ|じゅーしぃ', 'jushi (Okinawan seasoned rice)', '주시(오키나와식 영양밥)', '沖繩炊飯', '冲绳炊饭'],
    ['コーレーグース|こーれーぐーす', 'kōrēgūsu (chili pepper steeped in awamori)', '코레구스(고추를 담근 아와모리)', '島辣椒泡盛', '岛辣椒泡盛'],
    ['紅生姜', 'pickled red ginger', '붉은 생강 초절임', '紅薑', '红姜'],
    ['かまぼこ|カマボコ', 'kamaboko (fish cake)', '가마보코(어묵)', '魚板', '鱼板'],
    ['中身汁|中味汁|なかみ汁', 'nakami-jiru (pork offal soup)', '나카미지루(돼지 내장국)', '豬內臟湯', '猪内脏汤'],
    ['中身そば|中味そば|なかみそば', 'nakami soba (noodle soup with pork offal)', '나카미 소바(돼지 내장 소바)', '豬內臟沖繩麵', '猪内脏冲绳面'],
    ['骨汁', 'kotsu-jiru (pork bone soup)', '코츠지루(돼지뼈 국)', '大骨湯', '大骨汤'],
    ['ゆし豆腐|ゆしどうふ|ゆしどーふ|ゆし豆富', 'yushi-dofu (soft fresh Okinawan tofu)', '유시두부(오키나와식 순두부)', '沖繩嫩豆腐', '冲绳嫩豆腐'],
    ['島豆腐', 'shima-dofu (firm Okinawan tofu)', '시마두부(오키나와식 단단한 두부)', '沖繩島豆腐', '冲绳岛豆腐'],
    ['アーサ|あーさ|アーサー', 'āsa (green sea lettuce)', '아사(파래)', '石蓴', '石莼'],
    ['ちゃんぷるー|チャンプルー|ちゃんぷる|チャンプル', 'champuru (Okinawan stir-fry)', '참프루(오키나와식 볶음)', '什錦炒', '什锦炒'],
    ['ゴーヤー|ゴーヤ', 'goya (bitter melon)', '고야(여주)', '苦瓜', '苦瓜'],
    ['泡盛', 'awamori (Okinawan rice spirit)', '아와모리(오키나와 소주)', '泡盛（沖繩燒酒）', '泡盛（冲绳烧酒）'],
    ['ぜんざい', 'Okinawan zenzai (shaved ice with sweet beans)', '젠자이(단팥 빙수)', '沖繩紅豆冰', '冲绳红豆冰'],
    ['いなむるち|イナムルチ', 'inamuruchi (Okinawan miso pork soup)', '이나무루치(오키나와식 된장 돼지고기국)', '沖繩味噌豬肉湯', '冲绳味噌猪肉汤'],
    ['クーブイリチー', 'kubu irichi (stir-fried kelp)', '쿠부이리치(다시마 볶음)', '炒昆布絲', '炒昆布丝'],
    ['ミミガー', 'mimiga (pig ear)', '미미가(돼지귀)', '豬耳朵', '猪耳朵'],
    ['歌三線', 'uta-sanshin (singing with the sanshin)', '우타산신(산신 연주와 노래)', '三線彈唱', '三线弹唱'],
    ['三線', 'sanshin (Okinawan three-string lute)', '산신(오키나와 삼현 악기)', '三線（沖繩三弦琴）', '三线（冲绳三弦琴）'],
    ['安里屋ユンタ', 'Asadoya Yunta (Okinawan folk song)', '아사도야 윤타(오키나와 민요)', '安里屋Yunta（沖繩民謠）', '安里屋Yunta（冲绳民谣）'],
    ['筋感', 'stringy texture', '힘줄 같은 질긴 식감', '筋感（口感偏韌）', '筋感（口感偏韧）'],
    ['麺リフト', 'noodle lift', '면 리프트(면을 들어 올린 사진)', '麵條特寫', '面条特写'],
    ['着丼', 'the bowl arrives', '소바가 나왔습니다', '上桌', '上桌'],
    ['そば処', 'soba-dokoro ', '소바도코로 ', '麵館', '面馆'],
    ['そば屋', 'soba shop', '소바 가게', '沖繩麵店', '冲绳面店'],
    ['そば', 'soba', '소바', '麵', '面'],
    ['麺　　：', 'Noodles: ', '면: ', '麵：', '面：'],
    ['スープ：', 'Soup: ', '수프: ', '湯頭：', '汤头：'],
    ['具　　：', 'Toppings: ', '토핑: ', '配料：', '配料：']
  ];

  // ---- 現在の言語（cookie googtrans=/ja/xx、または translate.goog の _x_tr_tl）
  function getLang() {
    var m = document.cookie.match(/(?:^|;\s*)googtrans=\/ja\/([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
    var q = new URLSearchParams(location.search).get('_x_tr_tl');
    return q || 'ja';
  }
  function setCookie(v) {
    var exp = v ? '; max-age=31536000' : '; max-age=0';
    document.cookie = 'googtrans=' + (v || '') + '; path=/' + exp;
    document.cookie = 'googtrans=' + (v || '') + '; path=/; domain=' + location.hostname + exp;
  }
  var lang = getLang();
  var col = { en: 1, ko: 2, 'zh-TW': 3, 'zh-CN': 4 }[lang];

  // ---- 用語集の差し替え
  var re = null, map = {}, pad = (lang === 'en' || lang === 'ko');
  if (col) {
    var keys = [];
    GLOSSARY.forEach(function (row) {
      row[0].split('|').forEach(function (k) { map[k] = row[col]; keys.push(k); });
    });
    keys.sort(function (a, b) { return b.length - a.length; });
    re = new RegExp(keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'), 'g');
  }
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, svg: 1 };
  function skipEl(el) {
    for (; el && el !== document.body; el = el.parentNode) {
      if (el.nodeType !== 1) continue;
      if (SKIP[el.tagName] || el.classList.contains('i18n-gl') || el.id === 'i18n-switch') return true;
    }
    return false;
  }
  var busy = false, seen = {}, lastHash = location.hash;
  function applyGlossary(root) {
    if (!re || !root) return;
    if (location.hash !== lastHash) { seen = {}; lastHash = location.hash; } // 記事が変わったら説明を付け直す
    busy = true;
    try {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
      while ((n = w.nextNode())) { re.lastIndex = 0; if (re.test(n.nodeValue)) nodes.push(n); }
      nodes.forEach(function (t) {
        if (!t.parentNode || skipEl(t.parentNode)) return;
        // 文を途切れさせないよう、訳語をそのまま日本語の文中に埋め込む（Google はこの訳語を残して文全体を訳す）
        t.nodeValue = t.nodeValue.replace(re, function (k) {
          var full = map[k], word = full;
          // 説明（かっこ書き）はページで最初の1回だけ付ける
          if (seen[full]) word = full.replace(/\s*[（(][^（）()]*[）)]\s*$/, ''); else seen[full] = 1;
          return pad ? ' ' + word + ' ' : word;
        });
      });
    } finally { busy = false; }
  }

  // ---- 切り替えボタン
  function buildSwitch() {
    var css = document.createElement('style');
    css.textContent =
      '#i18n-switch{position:fixed;right:14px;bottom:14px;z-index:90;font-family:"Noto Sans JP",sans-serif}' +
      '#i18n-switch>button{border:1px solid #bfe3ef;background:#043a5c;color:#fff;border-radius:999px;padding:.55rem .95rem;font-size:.85rem;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer}' +
      '#i18n-menu{position:absolute;right:0;bottom:calc(100% + 8px);background:#fff;border:1px solid #bfe3ef;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);overflow:hidden;min-width:9.5em}' +
      '#i18n-menu[hidden]{display:none}' +
      '#i18n-menu button{display:block;width:100%;text-align:left;border:0;background:none;padding:.65rem 1rem;font-size:.9rem;color:#123c50;cursor:pointer}' +
      '#i18n-menu button[aria-current="true"]{background:#e3f4fa;font-weight:700}' +
      '#i18n-note{position:fixed;left:14px;right:80px;bottom:14px;z-index:89;background:#fff;border:1px solid #bfe3ef;border-radius:10px;padding:.6rem .8rem;font-size:.8rem;color:#123c50;box-shadow:0 4px 14px rgba(0,0,0,.2)}' +
      '.i18n-gl{font-style:normal}' +
      /* Google 翻訳の上部バー・吹き出しを隠す */
      'body{top:0!important}iframe.skiptranslate,.goog-te-banner-frame,#goog-gt-tt,.goog-te-balloon-frame{display:none!important}' +
      '.goog-text-highlight{background:none!important;box-shadow:none!important}#google_translate_element{display:none}';
    document.head.appendChild(css);
    var box = document.createElement('div');
    box.id = 'i18n-switch'; box.className = 'notranslate'; box.setAttribute('translate', 'no');
    var cur = LANGS.filter(function (l) { return l.code === lang; })[0] || LANGS[0];
    box.innerHTML = '<button type="button" aria-haspopup="true" aria-expanded="false">🌐 ' +
      (lang === 'ja' ? 'Language' : cur.label) + '</button><div id="i18n-menu" hidden></div>';
    var menu = box.querySelector('#i18n-menu');
    LANGS.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = l.label; b.setAttribute('lang', l.code);
      if (l.code === lang) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', function () { choose(l.code); });
      menu.appendChild(b);
    });
    var toggle = box.querySelector('button');
    toggle.addEventListener('click', function (e) {
      e.stopPropagation(); menu.hidden = !menu.hidden; toggle.setAttribute('aria-expanded', String(!menu.hidden));
    });
    document.addEventListener('click', function () { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); });
    document.body.appendChild(box);
  }
  function choose(code) {
    if (code === lang) return;
    if (/\.translate\.goog$/.test(location.hostname)) {
      // 予備ルート（Google翻訳サイト経由）で見ている場合は、元のサイトに戻して切り替える
      var orig = 'https://anji-1173.github.io' + location.pathname + location.hash;
      if (code === 'ja') { location.href = orig; return; }
    }
    setCookie(code === 'ja' ? '' : '/ja/' + code);
    location.reload();
  }

  // ---- Google 翻訳の読み込み（失敗したら予備ルートを案内）
  function loadGoogle() {
    var holder = document.createElement('div'); holder.id = 'google_translate_element';
    document.body.appendChild(holder);
    window.__gtInit = function () {
      try {
        new google.translate.TranslateElement({ pageLanguage: 'ja', includedLanguages: 'en,ko,zh-TW,zh-CN', autoDisplay: false }, 'google_translate_element');
      } catch (e) { fallback(); }
    };
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=__gtInit';
    s.onerror = fallback;
    document.head.appendChild(s);
    setTimeout(function () { if (!(window.google && google.translate && google.translate.TranslateElement)) fallback(); }, 8000);
  }
  var fellBack = false;
  function fallback() {
    if (fellBack || /\.translate\.goog$/.test(location.hostname)) return;
    fellBack = true;
    var u = 'https://anji--1173-github-io.translate.goog' + location.pathname + '?_x_tr_sl=ja&_x_tr_tl=' + encodeURIComponent(lang) + '&_x_tr_hl=' + encodeURIComponent(lang) + location.hash;
    var msg = { en: 'Translation could not load here.', ko: '번역을 불러오지 못했습니다.', 'zh-TW': '無法載入翻譯。', 'zh-CN': '无法加载翻译。' }[lang] || '';
    var open = { en: 'Open translated page', ko: '번역 페이지 열기', 'zh-TW': '開啟翻譯頁面', 'zh-CN': '打开翻译页面' }[lang] || 'Open';
    var d = document.createElement('div'); d.id = 'i18n-note'; d.className = 'notranslate'; d.setAttribute('translate', 'no');
    d.innerHTML = msg + ' <a href="' + u + '">' + open + '</a>';
    document.body.appendChild(d);
  }

  function start() {
    if (lang !== 'ja') {
      document.documentElement.setAttribute('data-i18n', lang);
      applyGlossary(document.body);
      // 記事の切り替えなど、あとから描かれた部分にも用語集を当てる
      new MutationObserver(function (muts) {
        if (busy) return;
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (nd) {
            if (nd.nodeType === 3) { if (nd.parentNode && !skipEl(nd.parentNode)) applyGlossary(nd.parentNode); }
            else if (nd.nodeType === 1 && !skipEl(nd)) applyGlossary(nd);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
      if (!/\.translate\.goog$/.test(location.hostname)) loadGoogle();
    }
    buildSwitch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
