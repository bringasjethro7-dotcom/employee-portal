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


  /* (2e) "at its best": ambient hero canvas (orbs + drifting diamonds that react to the cursor), 3D tilt on cards,
     rotating border glint, magnetic + ripple buttons, top progress bar on tab change, name sheen, points confetti,
     a "Classic look" switch in the sidebar footer. Decorative only; all paused when the tab is hidden or reduced-motion is on. */
  (function best() {
    var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var fine = true; try { fine = window.matchMedia('(pointer: fine)').matches; } catch (e) {}
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

    /* ── ambient canvas inside the hero ── */
    function ambient(host, opts) {
      if (!host || host.__srFx || reduce) return; host.__srFx = true;
      var cv = document.createElement('canvas'); cv.className = 'sr-fx'; cv.setAttribute('aria-hidden', 'true');
      host.insertBefore(cv, host.firstChild);
      var ctx = cv.getContext('2d'), W = 0, H = 0, DPR = Math.min(1.5, window.devicePixelRatio || 1), P = [], O = [], mx = -1e4, my = -1e4, t0 = performance.now(), raf = 0, on = true;
      function size() { var r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
      function seed() {
        P = []; O = [];
        var n = Math.round(Math.min(44, W / 32));
        for (var i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, s: 4 + Math.random() * 9, a: .08 + Math.random() * .22, vy: -(4 + Math.random() * 10), ph: Math.random() * 6.28, sp: .4 + Math.random() * .8, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4, fill: Math.random() < .35 });
        for (var j = 0; j < 3; j++) O.push({ x: Math.random() * W, y: Math.random() * H, r: 180 + Math.random() * 160, ph: Math.random() * 6.28, sp: .12 + Math.random() * .1, c: j === 1 ? '255,228,209' : '255,235,220' });
      }
      function diamond(x, y, s, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * .72, 0); ctx.lineTo(0, s); ctx.lineTo(-s * .72, 0); ctx.closePath(); ctx.restore(); }
      var last = t0;
      function frame(now) {
        raf = 0; if (!on) return;
        var dt = Math.min(.05, (now - last) / 1000); last = now; var t = (now - t0) / 1000;
        ctx.clearRect(0, 0, W, H);
        /* soft orbs */
        O.forEach(function (o) {
          var ox = o.x + Math.sin(t * o.sp + o.ph) * 60, oy = o.y + Math.cos(t * o.sp * .8 + o.ph) * 40;
          var g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r); g.addColorStop(0, 'rgba(' + o.c + ',.55)'); g.addColorStop(1, 'rgba(' + o.c + ',0)');
          ctx.fillStyle = g; ctx.fillRect(ox - o.r, oy - o.r, o.r * 2, o.r * 2);
        });
        /* diamonds */
        P.forEach(function (p) {
          p.y += p.vy * dt; p.x += Math.sin(t * p.sp + p.ph) * 12 * dt; p.r += p.vr * dt;
          var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy, R = 150;
          if (d2 < R * R) { var d = Math.sqrt(d2) || 1, f = (1 - d / R) * 90 * dt; p.x += dx / d * f; p.y += dy / d * f; }
          if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; } if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
          diamond(p.x, p.y, p.s, p.r);
          if (p.fill) { ctx.fillStyle = 'rgba(242,106,27,' + (p.a * .7).toFixed(3) + ')'; ctx.fill(); }
          else { ctx.strokeStyle = 'rgba(242,106,27,' + p.a.toFixed(3) + ')'; ctx.lineWidth = 1.4; ctx.stroke(); }
        });
        raf = requestAnimationFrame(frame);
      }
      function start() { if (!raf && on) { last = performance.now(); raf = requestAnimationFrame(frame); } }
      size(); seed(); start();
      host.addEventListener('mousemove', function (e) { var r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
      host.addEventListener('mouseleave', function () { mx = -1e4; my = -1e4; });
      window.addEventListener('resize', function () { size(); seed(); });
      document.addEventListener('visibilitychange', function () { on = !document.hidden; if (on) start(); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { on = es[0].isIntersecting && !document.hidden; if (on) start(); }).observe(host);
    }

    /* ── 3D tilt + rotating glint on cards ── */
    function cards() {
      if (!fine || reduce) return;
      $$('#dashboard-screen .main-content .card').forEach(function (c) {
        if (c.__srTilt || c.id === 'dashboard-hero') return; c.__srTilt = true;
        var g = document.createElement('i'); g.className = 'sr-glint'; g.setAttribute('aria-hidden', 'true'); c.appendChild(g);
        c.addEventListener('mousemove', function (e) {
          var r = c.getBoundingClientRect(); if (r.width > 900) return;   /* wide cards don't tilt, it looks odd */
          var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
          c.style.setProperty('--rx', (-py * 3).toFixed(2) + 'deg'); c.style.setProperty('--ry', (px * 4).toFixed(2) + 'deg'); c.classList.add('sr-tilt');
        });
        c.addEventListener('mouseleave', function () { c.classList.remove('sr-tilt'); c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); });
      });
    }

    /* ── magnetic + ripple primary buttons ── */
    function buttons() {
      $$('#dashboard-screen .btn-primary, #dashboard-screen button.primary, #dashboard-screen #btn-time-in, #dashboard-screen button[style*="linear-gradient"]').forEach(function (b) {
        if (b.__srBtn) return; b.__srBtn = true;
        if (fine && !reduce) {
          b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height; b.style.setProperty('--tx', (dx * 6).toFixed(1) + 'px'); b.style.setProperty('--ty', (dy * 4).toFixed(1) + 'px'); b.classList.add('sr-mag'); });
          b.addEventListener('mouseleave', function () { b.classList.remove('sr-mag'); b.style.removeProperty('--tx'); b.style.removeProperty('--ty'); });
        }
        b.addEventListener('pointerdown', function (e) {
          if (reduce) return; var r = b.getBoundingClientRect(); var s = document.createElement('i'); s.className = 'sr-ripple';
          var d = Math.max(r.width, r.height) * 1.6; s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
          b.appendChild(s); setTimeout(function () { s.remove(); }, 700);
        });
      });
    }

    /* ── top progress bar on tab change ── */
    var bar = null, barT = 0;
    function progress() {
      if (!bar) { bar = document.createElement('i'); bar.id = 'sr-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar); }
      clearTimeout(barT); bar.className = ''; void bar.offsetWidth; bar.className = 'go';
      barT = setTimeout(function () { bar.className = 'done'; barT = setTimeout(function () { bar.className = ''; }, 350); }, 380);
    }

    /* ── confetti when JMB Points go up ── */
    function confetti(el) {
      if (reduce) return; var r = el.getBoundingClientRect();
      for (var i = 0; i < 18; i++) {
        var s = document.createElement('i'); s.className = 'sr-confetti'; s.setAttribute('aria-hidden', 'true'); var big = Math.random() < .3;
        s.style.cssText = 'left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height / 2) + 'px;width:' + (big ? 10 : 6) + 'px;height:' + (big ? 10 : 6) + 'px;background:' + (Math.random() < .5 ? '#F26A1B' : (Math.random() < .5 ? '#FFB98A' : '#C2410C'));
        document.body.appendChild(s);
        var a = Math.random() * 6.28, v = 90 + Math.random() * 120;
        s.animate([{ transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 }, { transform: 'translate(' + (Math.cos(a) * v) + 'px,' + (Math.sin(a) * v + 60) + 'px) rotate(' + (Math.random() * 540) + 'deg) scale(.4)', opacity: 0 }], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
        (function (el) { setTimeout(function () { el.remove(); }, 1500); })(s);
      }
    }
    function pointsWatch() {
      var el = $('#hero-st-pts'); if (!el || el.__srPts) return; el.__srPts = true;
      var last = parseFloat((el.textContent || '').replace(/[^\d.]/g, '')) || 0;
      new MutationObserver(function () { var v = parseFloat((el.textContent || '').replace(/[^\d.]/g, '')); if (!isNaN(v) && v > last && last > 0 && !el.__srBusy) confetti(el); if (!isNaN(v) && !el.__srBusy) last = v; }).observe(el, { childList: true, characterData: true, subtree: true });
    }

    /* ── "Classic look" switch in the sidebar footer ── */
    function toggle() {
      var foot = $('#dashboard-screen .tabs .au-side-foot'); if (!foot || !foot.offsetParent || $('#sr-classic')) return;
      var b = document.createElement('button'); b.id = 'sr-classic'; b.type = 'button'; b.title = 'Switch back to the previous look'; b.textContent = 'Classic look';
      b.addEventListener('click', function () { try { localStorage.setItem('aura_theme', 'light'); } catch (e) {} location.href = location.pathname + '?theme=light'; });
      foot.appendChild(b);
    }

    function tick() { ambient($('#dashboard-hero')); cards(); buttons(); pointsWatch(); toggle(); }
    var n = 0, t = setInterval(function () { tick(); if (++n > 80) clearInterval(t); }, 450);
    setTimeout(function hook() {
      if (typeof window.switchTab === 'function' && !window.switchTab.__srBest) {
        var o = window.switchTab; var w = function () { progress(); var r = o.apply(this, arguments); setTimeout(function () { cards(); buttons(); }, 60); return r; };
        w.__srBest = true; w.__sr = o.__sr; w.__srMotion = o.__srMotion; window.switchTab = w;
      } else if (!window.switchTab) setTimeout(hook, 300);
    }, 900);
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
