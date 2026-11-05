/* SUNRISE PASTEL theme switch · Nov 2026
   ?theme=sunrise turns the Sunrise look on and remembers it; ?theme=light / ?theme=dark turn it off.
   Everything visual lives in sunrise.css, scoped to body.au-sunrise, so nothing here touches data or logic.
   This file only: (1) sets the body class, (2) keeps the real JMB logo in the sidebar,
   (3) starts the messages rail collapsed in Sunrise (the chat button in the header opens it; remembered). */
(function () {
  var KEY = 'aura_theme', q = null;
  try { q = (location.search.match(/[?&]theme=(sunrise|light|dark)\b/) || [])[1]; } catch (e) {}
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  var mode = q || saved || 'sunrise';                     /* ← default. Change to (q || saved || 'light') to keep Aura as default. */
  try { if (q) localStorage.setItem(KEY, q); } catch (e) {}
  var on = mode === 'sunrise';

  /* (2) real logo: the app replaces #header-logo-img with an inline outline SVG after sign-in; put the brand logo back whenever that happens */
  var LOGO = (function () { try { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/sunrise\.js.*$/, 'sunrise-logo.png') : 'sunrise-logo.png'; } catch (e) { return 'sunrise-logo.png'; } })();
  function fixLogo() {
    if (!on) return;
    var img = document.getElementById('header-logo-img'); if (!img) return;
    if (img.getAttribute('src') !== LOGO) img.setAttribute('src', LOGO);
  }
  function watchLogo() {
    var img = document.getElementById('header-logo-img'); if (!img || img.__srWatched) return;
    img.__srWatched = true;
    new MutationObserver(fixLogo).observe(img, { attributes: true, attributeFilter: ['src'] });
  }

  function apply() {
    document.body.classList.toggle('au-sunrise', on);
    if (on) document.body.classList.add('au-light');       /* Sunrise is built on the light tokens */
    fixLogo(); watchLogo();
  }
  if (document.body) apply(); else document.addEventListener('DOMContentLoaded', apply);
  var n = 0, t0 = setInterval(function () { fixLogo(); watchLogo(); if (++n > 60) clearInterval(t0); }, 500);

  /* (2b) top bar: page title + today's date (sunrise.css draws them from data-sr-title / data-sr-date) */
  var TITLES = { overview:'Overview', feed:'Feed', attendance:'Attendance & Time', leave:'Leave', scorecard:'HR & Scorecard', payslips:'Payslip',
                 myprod:'Productivity', activities:'Activities & Rewards', clockify:'Time tracker', tools:'Tools & Automation', profile:'My Profile', messages:'Messages' };
  function setTitle(name) {
    if (!on) return;
    var h = document.querySelector('#dashboard-screen > header'); if (!h) return;
    var t = TITLES[name]; if (!t) { var b = document.querySelector('.tabs .tab-btn.active'); t = b ? (b.getAttribute('title') || b.textContent).trim() : 'Overview'; }
    h.setAttribute('data-sr-title', t);
    try { h.setAttribute('data-sr-date', new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })); } catch (e) {}
  }
  function hookTabs() {
    if (typeof window.switchTab !== 'function' || window.switchTab.__sr) return;
    var orig = window.switchTab;
    var w = function (name, btn) { var r = orig.apply(this, arguments); try { setTitle(name); } catch (e) {} return r; };
    w.__sr = true; window.switchTab = w;
  }
  var m = 0, t1 = setInterval(function () { hookTabs(); setTitle(); if (++m > 40) clearInterval(t1); }, 300);

  var prev = window.auraSetTheme;
  window.auraSetTheme = function (m) {
    on = m === 'sunrise';
    try { localStorage.setItem(KEY, m); } catch (e) {}
    if (typeof prev === 'function') prev(on ? 'light' : m);
    apply();
  };

  if (!on) return;

  /* (2c) sidebar "dock" magnification — like the macOS Dock: the menu row under the cursor grows,
     its neighbours grow a little less, and the rows spread apart to make room; everything eases
     back when the cursor leaves. Desktop only; off when the person prefers reduced motion. */
  (function dock() {
    var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (reduce) return;
    var RADIUS = 76, ROW = 0.085, ICON = 0.42, SPREAD = 0.55;   /* px, max row scale +8.5%, max icon scale +42%, how much rows push apart */
    var tabs = null, items = [], raf = 0, y = null, active = false;
    function imp(el, prop, val) { el.style.setProperty(prop, val, 'important'); }
    function collect() {
      tabs = document.querySelector('#dashboard-screen .tabs'); if (!tabs) return false;
      items = Array.prototype.filter.call(tabs.querySelectorAll('.tab-btn'), function (b) { return b.offsetParent !== null; });
      return items.length > 0;
    }
    function prep(b) {
      if (b.__srDock) return; b.__srDock = true;
      imp(b, 'transform-origin', 'left center'); imp(b, 'will-change', 'transform');
      imp(b, 'transition', 'transform .09s ease-out, background-color .15s ease');
      var ic = b.querySelector('svg'); if (ic) { imp(ic, 'transform-origin', 'center'); imp(ic, 'transition', 'transform .09s ease-out'); }
    }
    function frame() {
      raf = 0; if (y === null) return;
      var n = items.length, s = new Array(n), extra = new Array(n), r = new Array(n);
      for (var i = 0; i < n; i++) {
        r[i] = items[i].getBoundingClientRect();
        var d = (y - (r[i].top + r[i].height / 2)) / RADIUS, g = Math.exp(-d * d);
        s[i] = g; extra[i] = r[i].height * ROW * g;
      }
      for (var k = 0; k < n; k++) {
        var off = 0;
        for (var j = 0; j < n; j++) { if (j === k) continue; off += (j < k ? 1 : -1) * extra[j] * SPREAD; }
        var b = items[k]; prep(b);
        imp(b, 'transform', 'translateY(' + off.toFixed(2) + 'px) scale(' + (1 + ROW * s[k]).toFixed(4) + ')');
        imp(b, 'z-index', String(10 + Math.round(s[k] * 10)));
        var ic = b.querySelector('svg'); if (ic) imp(ic, 'transform', 'scale(' + (1 + ICON * s[k]).toFixed(4) + ')');
      }
    }
    function reset() {
      y = null;
      items.forEach(function (b) {
        imp(b, 'transition', 'transform .38s cubic-bezier(.2,.9,.25,1.15), background-color .15s ease');
        imp(b, 'transform', 'translateY(0) scale(1)'); b.style.removeProperty('z-index');
        var ic = b.querySelector('svg'); if (ic) { imp(ic, 'transition', 'transform .38s cubic-bezier(.2,.9,.25,1.15)'); imp(ic, 'transform', 'scale(1)'); }
        setTimeout(function () { b.__srDock = false; }, 400);
      });
    }
    function bind() {
      if (active || !collect()) return; active = true;
      tabs.addEventListener('mousemove', function (e) {
        if (window.innerWidth < 900 || e.pointerType === 'touch') return;
        if (!items.length || items[0].offsetParent === null) collect();
        y = e.clientY; if (!raf) raf = requestAnimationFrame(frame);
      });
      tabs.addEventListener('mouseleave', reset);
      document.addEventListener('visibilitychange', function () { if (document.hidden) reset(); });
    }
    var tries = 0, t = setInterval(function () { bind(); if (active || ++tries > 60) clearInterval(t); }, 300);
  })();


  /* (2d) graphics & motion: hero parallax, sidebar spotlight + gliding active pill, KPI count-up,
     ticking clock colon, title underline replay, scroll reveal. All cosmetic; nothing here touches data. */
  (function motion() {
    var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    function $(s, r) { return (r || document).querySelector(s); }
    /* hero parallax */
    function hero() {
      var h = $('#dashboard-hero'); if (!h || h.__sr) return; h.__sr = true;
      if (reduce) return;
      h.addEventListener('mousemove', function (e) {
        var r = h.getBoundingClientRect();
        h.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        h.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      h.addEventListener('mouseleave', function () { h.style.setProperty('--mx', '0'); h.style.setProperty('--my', '0'); });
    }
    /* sidebar spotlight + glider */
    var glider = null;
    function sidebar() {
      var t = $('#dashboard-screen .tabs'); if (!t || t.__sr) return; t.__sr = true;
      if (!reduce) {
        t.addEventListener('mousemove', function (e) { var r = t.getBoundingClientRect(); t.style.setProperty('--sx', (e.clientX - r.left) + 'px'); t.style.setProperty('--sy', (e.clientY - r.top) + 'px'); });
        t.addEventListener('mouseleave', function () { t.style.setProperty('--sx', '-300px'); t.style.setProperty('--sy', '-300px'); });
      }
      glider = document.createElement('i'); glider.className = 'sr-glider'; t.appendChild(glider); t.classList.add('sr-glide');
      glide(true);
    }
    function glide(first) {
      if (!glider) return; var t = glider.parentNode; var a = $('.tab-btn.active', t); if (!a || window.innerWidth < 900) { glider.classList.remove('on'); return; }
      var tr = t.getBoundingClientRect(), ar = a.getBoundingClientRect();
      if (first) glider.style.transition = 'none';
      glider.style.top = (ar.top - tr.top + t.scrollTop) + 'px'; glider.style.height = ar.height + 'px'; glider.classList.add('on');
      if (first) { void glider.offsetHeight; glider.style.transition = ''; }
    }
    /* KPI count-up: animate whenever the app writes a new number into a tile */
    function countUp(el) {
      if (el.__srBusy || reduce) return;
      var txt = el.textContent.trim(), m = txt.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/); if (!m) return;
      var pre = m[1], suf = m[3], target = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, comma = m[2].indexOf(',') >= 0;
      var from = el.__srLast || 0; if (from === target) return; el.__srLast = target;
      var t0 = performance.now(), D = 900; el.__srBusy = true;
      (function step(now) {
        var p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3), v = from + (target - from) * e;
        var str = v.toFixed(dec); if (comma) str = str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        el.textContent = pre + str + suf;
        if (p < 1) requestAnimationFrame(step); else { el.textContent = txt; el.__srBusy = false; }
      })(t0);
    }
    function kpis() {
      document.querySelectorAll('#dashboard-hero .hstat-v').forEach(function (el) {
        if (el.__srObs) return; el.__srObs = true; countUp(el);
        new MutationObserver(function () { if (!el.__srBusy) countUp(el); }).observe(el, { childList: true, characterData: true, subtree: true });
      });
    }
    /* clock colon tick, title underline */
    function clock() { document.querySelectorAll('#wclock .wc-time').forEach(function (el) { el.classList.add('sr-tick'); }); }
    function swapTitle() { var h = $('#dashboard-screen > header'); if (!h) return; h.classList.remove('sr-swap'); void h.offsetWidth; h.classList.add('sr-swap'); }
    /* scroll reveal for cards below the fold */
    function reveal() {
      if (reduce || !('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('sr-in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
      document.querySelectorAll('#dashboard-screen .main-content .card').forEach(function (c) {
        if (c.__srRev || c.id === 'dashboard-hero') return; c.__srRev = true;
        var r = c.getBoundingClientRect(); if (r.top > window.innerHeight) { c.classList.add('sr-reveal'); io.observe(c); }
      });
    }
    function tick() { hero(); sidebar(); kpis(); clock(); reveal(); glide(); }
    var n = 0, t = setInterval(function () { tick(); if (++n > 80) clearInterval(t); }, 400);
    window.addEventListener('resize', function () { glide(true); });
    var origSwitch = null;
    setTimeout(function hook() {
      if (typeof window.switchTab === 'function' && !window.switchTab.__srMotion) {
        var o = window.switchTab; var w = function () { var r = o.apply(this, arguments); setTimeout(function () { glide(); swapTitle(); reveal(); }, 20); return r; };
        w.__srMotion = true; w.__sr = o.__sr; window.switchTab = w;
      } else if (!window.switchTab) setTimeout(hook, 300);
    }, 600);
  })();

  /* (3) messages rail: collapsed by default in Sunrise, remembered per device */
  var RAIL = 'sunrise_rail';
  function railPref() { try { return localStorage.getItem(RAIL); } catch (e) { return null; } }
  function collapse() {
    if (railPref() === 'open') return;
    if (document.body.classList.contains('au-dock') && !document.body.classList.contains('au-dock-hidden')) {
      document.body.classList.add('au-dock-hidden');
      var f = document.getElementById('msg-fab'); if (f) f.classList.remove('active');
    }
  }
  var tries = 0, t = setInterval(function () { collapse(); if (++tries > 40 || document.body.classList.contains('au-dock')) clearInterval(t); }, 250);
  document.addEventListener('click', function (e) {
    var fab = e.target && e.target.closest && e.target.closest('#msg-fab'); if (!fab) return;
    setTimeout(function () { try { localStorage.setItem(RAIL, document.body.classList.contains('au-dock-hidden') ? 'closed' : 'open'); } catch (x) {} }, 50);
  }, true);
})();
