/* =========================================================
   SUIGEN 水源 — main.js
   デザイン憲法: _docs/DESIGN_TOKENS.md
   方針: 参考再現が目的のため prefers-reduced-motion は無視して常時アニメ
        （フロー書 §1③★ / RMガードで全演出が消える罠を回避）
   ========================================================= */
(function () {
  'use strict';

  var REDUCE = false; // ★固定。RMガードは置かない（フロー書§1③★）
  var html = document.documentElement;
  var body = document.body;

  /* ---------------------------------------------------------
     1. OPENING
        ダークネイビー放射グラデ + canvasの水の波紋 + ロゴ → フェードアウト
        canvasは2Dコンテキストのみ（iOS安全 / 3D・blur・blend不使用）
     --------------------------------------------------------- */
  function initOpening() {
    var opening = document.querySelector('.opening');
    if (!opening) { body.classList.add('is-opened'); return; }

    var canvas = opening.querySelector('canvas');
    var logo = opening.querySelector('.opening__logo');
    var raf = null;
    var startedAt = 0;

    if (canvas && canvas.getContext) {
      var ctx = canvas.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = 0, h = 0;

      var resize = function () {
        w = opening.clientWidth; h = opening.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();

      // 水面に広がる波紋（同心円）＋ 微細な光点
      var rings = [];
      for (var i = 0; i < 5; i++) rings.push({ delay: i * 420, r: 0 });
      var motes = [];
      for (var m = 0; m < 26; m++) {
        motes.push({
          x: Math.random(), y: Math.random(),
          r: 0.6 + Math.random() * 1.7,
          sp: 0.04 + Math.random() * 0.12,
          a: 0.12 + Math.random() * 0.34
        });
      }

      var draw = function (ts) {
        if (!startedAt) startedAt = ts;
        var el = ts - startedAt;
        ctx.clearRect(0, 0, w, h);
        var cx = w / 2, cy = h / 2;

        // 波紋
        for (var i = 0; i < rings.length; i++) {
          var t = el - rings[i].delay;
          if (t < 0) continue;
          var p = (t % 3600) / 3600;              // 0→1 ループ
          var rad = p * Math.max(w, h) * 0.62;
          var alpha = (1 - p) * 0.30;
          if (alpha <= 0) continue;
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(214,228,240,' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // 中心のやわらかい光
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.34);
        g.addColorStop(0, 'rgba(190,214,232,0.16)');
        g.addColorStop(1, 'rgba(190,214,232,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        // 上昇する光点
        for (var k = 0; k < motes.length; k++) {
          var mo = motes[k];
          mo.y -= mo.sp / 100;
          if (mo.y < -0.05) { mo.y = 1.05; mo.x = Math.random(); }
          ctx.beginPath();
          ctx.arc(mo.x * w, mo.y * h, mo.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(226,238,248,' + mo.a.toFixed(3) + ')';
          ctx.fill();
        }
        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
      window.addEventListener('resize', resize);
    }

    if (logo) setTimeout(function () { logo.classList.add('is-in'); }, 260);

    var close = function () {
      body.classList.add('is-opened');
      setTimeout(function () {
        if (raf) cancelAnimationFrame(raf);
        if (opening.parentNode) opening.parentNode.removeChild(opening);
      }, 1400);
    };
    // 表示 2.6s 後に退場。読み込みが遅い場合も最大 4s で必ず開ける
    var opened = false;
    var openOnce = function () { if (!opened) { opened = true; close(); } };
    window.addEventListener('load', function () { setTimeout(openOnce, 2600); });
    setTimeout(openOnce, 4000);
  }

  /* ---------------------------------------------------------
     2. Lenis 慣性スムーススクロール（無ければネイティブへフォールバック）
     --------------------------------------------------------- */
  var lenis = null;
  function initLenis() {
    if (typeof window.Lenis !== 'function') return;
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1.05, smoothWheel: true });
    window.lenis = lenis;
    var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    lenis.on('scroll', onScroll);
  }

  function scrollToTarget(target) {
    if (lenis) { lenis.scrollTo(target, { offset: -70 }); return; }
    var top = target.getBoundingClientRect().top + window.pageYOffset - 70;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  /* ---------------------------------------------------------
     3. Reveal（人格 = opacity 1.3s ease / 移動を伴わない）
     --------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.r, .r-up');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* ---------------------------------------------------------
     4. Header（hero上=透明/白文字、抜けたら solid）＋ Drawer
     --------------------------------------------------------- */
  var header = document.querySelector('.header');
  var hero = document.querySelector('.hero');
  var floatcta = document.querySelector('.floatcta');

  function onScroll() {
    var y = window.pageYOffset || html.scrollTop;
    if (header) {
      var threshold = hero ? hero.offsetHeight - 80 : 40;
      if (y > threshold) {
        header.classList.add('header--solid');
        header.classList.remove('header--onhero');
      } else {
        header.classList.remove('header--solid');
        if (hero) header.classList.add('header--onhero');
      }
    }
    if (floatcta) {
      if (y > (window.innerHeight * 0.8)) floatcta.classList.add('is-in');
      else floatcta.classList.remove('is-in');
    }
    updateParallax();
  }

  function initHeader() {
    if (header && hero) header.classList.add('header--onhero');
    var burger = document.querySelector('.header__burger');
    var drawer = document.querySelector('.drawer');
    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var open = body.classList.toggle('is-menu-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (lenis) { open ? lenis.stop() : lenis.start(); }
        body.style.overflow = open ? 'hidden' : '';
      });
      drawer.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          body.classList.remove('is-menu-open');
          burger.setAttribute('aria-expanded', 'false');
          body.style.overflow = '';
          if (lenis) lenis.start();
        }
      });
    }
    // アンカーリンクを Lenis 経由に
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var t = document.querySelector(id);
      if (!t) return;
      a.addEventListener('click', function (e) { e.preventDefault(); scrollToTarget(t); });
    });
  }

  /* ---------------------------------------------------------
     5. Hero スライダー（自動切替 + ドット / scroll-jacking なし）
     --------------------------------------------------------- */
  function initHeroSlider() {
    var slides = document.querySelectorAll('.hero__slide');
    var dots = document.querySelectorAll('.hero__dots button');
    if (slides.length < 2) return;
    var idx = 0, timer = null;

    var go = function (n) {
      idx = (n + slides.length) % slides.length;
      for (var i = 0; i < slides.length; i++) slides[i].classList.toggle('is-active', i === idx);
      for (var d = 0; d < dots.length; d++) dots[d].setAttribute('aria-selected', d === idx ? 'true' : 'false');
    };
    var play = function () { timer = setInterval(function () { go(idx + 1); }, 5600); };
    var stop = function () { if (timer) clearInterval(timer); };

    for (var d = 0; d < dots.length; d++) {
      (function (n) {
        dots[n].addEventListener('click', function () { stop(); go(n); play(); });
      })(d);
    }
    go(0); play();
  }

  /* ---------------------------------------------------------
     6. パララックス（transform translate3d・速度控えめ）
        ※ overflow:hidden で sticky を壊さないよう CSS 側は overflow-x:clip
     --------------------------------------------------------- */
  var parallaxItems = [];
  function initParallax() {
    var nodes = document.querySelectorAll('.parallax__image');
    for (var i = 0; i < nodes.length; i++) {
      parallaxItems.push({ el: nodes[i], wrap: nodes[i].closest('.parallax') });
    }
    updateParallax();
  }
  function updateParallax() {
    if (!parallaxItems.length) return;
    var vh = window.innerHeight;
    for (var i = 0; i < parallaxItems.length; i++) {
      var it = parallaxItems[i];
      if (!it.wrap) continue;
      var r = it.wrap.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      var progress = (r.top + r.height / 2 - vh / 2) / vh;  // -1 〜 1
      var move = progress * -46;                             // 控えめ
      it.el.style.transform = 'translate3d(0,' + move.toFixed(2) + 'px,0)';
    }
  }

  /* ---------------------------------------------------------
     7. フォーム疑似送信（実送信しない）
     --------------------------------------------------------- */
  function initForm() {
    var form = document.querySelector('.form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hp = form.querySelector('.form__hp input');
      if (hp && hp.value) return;                  // ハニーポット
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var done = document.querySelector('.form__done');
      form.style.display = 'none';
      if (done) {
        done.classList.add('is-shown');
        done.setAttribute('tabindex', '-1');
        done.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     8. 起動
     --------------------------------------------------------- */
  function init() {
    // 撮影用フラグ（?shot=）: 演出をスキップして静止状態にする。通常表示には影響しない
    var SHOT = location.search.indexOf('shot=') !== -1;
    if (SHOT) {
      body.classList.add('is-opened');
      var _op = document.querySelector('.opening'); if (_op) _op.remove();
      var _fc = document.querySelector('.floatcta'); if (_fc) _fc.style.display = 'none';
      document.querySelectorAll('.r, .r-up').forEach(function (e) { e.classList.add('is-in'); });
    } else {
      initOpening();
    }
    initLenis();
    initHeader();
    initHeroSlider();
    initParallax();
    if (!SHOT) initReveal();
    initForm();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { updateParallax(); }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
