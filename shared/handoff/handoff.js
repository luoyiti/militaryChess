/*
 * 总台 ⇄ 战役转场（总台与每个战役页面共用，纯 JS、无依赖）。
 *  - 总台：window.__wrHandoff.save(record) 写入 sessionStorage，build(record) 铺上幕布，然后跳转；
 *  - 战役页面：tools/vite/catalog.ts 把本文件内联到 <body> 开头，第一帧就画出同一张幕布，
 *    引擎在地图就绪后调用 window.__wrHandoff.reveal() 揭幕（9 秒后无论如何自动揭幕）。
 * 记录只在 15 秒内、且战役 id 与当前页面一致时有效。
 */
(function () {
  var KEY = 'warroom:handoff';
  var api = window.__wrHandoff;
  if (api) return;

  function text(tag, cls, s) { var e = document.createElement(tag); e.className = cls; e.textContent = s || ''; return e; }

  function build(h) {
    var el = document.createElement('div');
    el.className = 'wr-handoff';
    el.id = 'wr-handoff';
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--wr-zs', String(Math.max(1.05, Math.min(6, h.zs || 1.5))));
    if (h.img) { var img = document.createElement('img'); img.alt = ''; img.decoding = 'sync'; img.src = h.img; el.appendChild(img); }
    el.appendChild(text('div', 'wr-vignette'));
    var card = text('div', 'wr-card');
    card.appendChild(text('div', 'wr-kicker', h.kicker || '作战总台 · 正在接通作战室'));
    card.appendChild(text('div', 'wr-mark', h.mark));
    card.appendChild(text('div', 'wr-title', h.title));
    card.appendChild(text('div', 'wr-en', h.en));
    card.appendChild(text('div', 'wr-dates', h.dates));
    var bar = text('div', 'wr-bar'); bar.appendChild(document.createElement('i')); card.appendChild(bar);
    el.appendChild(card);
    return el;
  }

  function reveal() {
    var el = document.getElementById('wr-handoff');
    try { sessionStorage.removeItem(KEY); } catch (e) { /* 隐私模式 */ }
    document.documentElement.classList.remove('wr-arriving');
    if (!el || el.classList.contains('wr-out')) return;
    el.classList.remove('wr-in');
    el.classList.add('wr-out');
    setTimeout(function () { el.remove(); }, 1250);
  }

  function save(h) {
    try { sessionStorage.setItem(KEY, JSON.stringify(h)); return true; }
    catch (e) { // 快照过大（配额）时只保留标题卡
      try { var copy = {}; for (var k in h) if (k !== 'img') copy[k] = h[k]; sessionStorage.setItem(KEY, JSON.stringify(copy)); } catch (e2) { /* ignore */ }
      return false;
    }
  }

  function arrive() {
    var raw = null;
    try { raw = sessionStorage.getItem(KEY); } catch (e) { return; }
    if (!raw) return;
    var h;
    try { h = JSON.parse(raw); } catch (e) { return; }
    var parts = location.pathname.split('/').filter(function (p) { return p && p !== 'index.html'; });
    var id = parts[parts.length - 1];
    if (!h || h.id !== id || Date.now() - h.at > 15000) { try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ } return; }
    document.documentElement.classList.add('wr-arriving');
    document.body.insertBefore(build(h), document.body.firstChild);
    setTimeout(reveal, 9000);
  }

  window.__wrHandoff = { KEY: KEY, build: build, save: save, reveal: reveal, arriving: function () { return !!document.getElementById('wr-handoff'); } };
  if (/\/campaigns\/[^/]+\/?(index\.html)?$/.test(location.pathname) && document.body) arrive();
})();
