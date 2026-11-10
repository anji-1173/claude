// 沖縄そば巡りの旅 — 言語切り替えボタン
// 翻訳は前もって用意したもの（i18n/<lang>.js）を表示する。Google 翻訳は使わない。
// ・トップ（index.html）… 選んだ言語を localStorage に保存して読み込み直す（index.html の先頭で i18n/<lang>.js を読む）
// ・お店ページ（shop/…、en/shop/… など）… 同じお店のその言語のページへ移動する（<link rel="alternate" hreflang>）
(function () {
  'use strict';
  var LANGS = [
    { code: 'ja', label: '日本語' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'zh-CN', label: '简体中文' }
  ];
  var KEY = 'soba-lang';
  var cur = window.SOBA_LANG || document.documentElement.getAttribute('lang') || 'ja';
  if (!LANGS.some(function (l) { return l.code === cur; })) cur = 'ja';

  function save(code) { try { localStorage.setItem(KEY, code); } catch (e) {} }

  function choose(code) {
    if (code === cur) return;
    save(code);
    var alt = document.querySelector('link[rel="alternate"][hreflang="' + code + '"]');
    if (document.documentElement.hasAttribute('data-static')) {
      // お店ページ：同じお店のその言語のページへ（いま見ているサイトからの相対アドレスで移動する）
      var m = location.pathname.match(/^(.*?)\/?(?:(?:en|ko|zh-TW|zh-CN)\/)?((?:shop|trivia)\/.*)$/);
      if (alt && m) { location.href = m[1] + '/' + (code === 'ja' ? '' : code + '/') + m[2] + location.search; return; }
    }
    // トップ・記事（#shop/…）：?lang= を外してから、必ずページを読み込み直す（保存した言語で表示される）。
    // ※ #shop/… が付いたURLへ location.replace しても「同じページ内の移動」扱いで読み込み直されないため reload を使う
    var u = new URL(location.href);
    u.searchParams.delete('lang');
    try { history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch (e) {}
    location.reload();
  }

  function build() {
    var css = document.createElement('style');
    css.textContent =
      '#i18n-switch{position:fixed;right:14px;bottom:14px;z-index:90;font-family:"Noto Sans JP",sans-serif}' +
      '#i18n-switch>button{border:1px solid #bfe3ef;background:#043a5c;color:#fff;border-radius:999px;padding:.55rem .95rem;font-size:.85rem;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer}' +
      '#i18n-menu{position:absolute;right:0;bottom:calc(100% + 8px);background:#fff;border:1px solid #bfe3ef;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);overflow:hidden;min-width:9.5em}' +
      '#i18n-menu[hidden]{display:none}' +
      '#i18n-menu button{display:block;width:100%;text-align:left;border:0;background:none;padding:.65rem 1rem;font-size:.9rem;color:#123c50;cursor:pointer}' +
      '#i18n-menu button[aria-current="true"]{background:#e3f4fa;font-weight:700}';
    document.head.appendChild(css);
    var box = document.createElement('div');
    box.id = 'i18n-switch';
    var label = cur === 'ja' ? 'Language' : LANGS.filter(function (l) { return l.code === cur; })[0].label;
    box.innerHTML = '<button type="button" aria-haspopup="true" aria-expanded="false">🌐 ' + label + '</button><div id="i18n-menu" hidden></div>';
    var menu = box.querySelector('#i18n-menu');
    LANGS.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = l.label; b.setAttribute('lang', l.code);
      if (l.code === cur) b.setAttribute('aria-current', 'true');
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

  // 以前の Google 翻訳の設定（cookie）が残っていたら消す
  ['', '; domain=' + location.hostname].forEach(function (d) { document.cookie = 'googtrans=; path=/; max-age=0' + d; });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
