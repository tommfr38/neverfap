// fx.js — shared visual effects for every NeverFap page.
//
// - injects the ambient background (gradient, aurora, rising embers, grain)
// - cursor spotlight on .nf-card
// - sticky header state on scroll
// - animated open/close for modals, exposed as NF_FX.openModal/closeModal
//
// Purely cosmetic: every page still works if this file fails to load.
(function () {
  var reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  // ---------------------------------------------------------------- modals
  // app.js toggles `hidden` / `flex`; these add an exit animation in between.
  var CLOSE_MS = 210;

  function openModal(el) {
    if (!el) return;
    clearTimeout(el._nfCloseT);
    el.classList.remove("is-closing", "hidden");
    el.classList.add("flex");
  }

  function hideNow(el) {
    el.classList.add("hidden");
    el.classList.remove("flex", "is-closing");
  }

  function closeModal(el) {
    if (!el) return;
    if (el.classList.contains("hidden")) {
      el.classList.remove("flex", "is-closing");
      return;
    }
    if (el.classList.contains("is-closing")) return;
    if (reduced) return hideNow(el);
    el.classList.add("is-closing");
    el._nfCloseT = setTimeout(function () { hideNow(el); }, CLOSE_MS);
  }

  // ---------------------------------------------------------------- background
  function injectBackground() {
    if (document.querySelector(".nf-bg") || document.body.hasAttribute("data-nf-no-bg")) return null;
    var bg = document.createElement("div");
    bg.className = "nf-bg";
    bg.setAttribute("aria-hidden", "true");
    bg.innerHTML =
      '<div class="nf-bg__base"></div>' +
      '<div class="nf-aurora nf-aurora--a"></div>' +
      '<div class="nf-aurora nf-aurora--b"></div>' +
      '<canvas class="nf-embers"></canvas>' +
      '<div class="nf-grain"></div>' +
      '<div class="nf-vignette"></div>';
    document.body.insertBefore(bg, document.body.firstChild);
    return bg.querySelector("canvas");
  }

  // Rising embers. Colour follows the flame stage via --ember-a / --ember-b.
  function startEmbers(canvas) {
    if (!canvas || reduced || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, parts = [], colA = "#f97316", colB = "#fbbf24";
    var last = performance.now(), colorClock = 0, running = true;

    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      colA = (cs.getPropertyValue("--ember-a") || "").trim() || colA;
      colB = (cs.getPropertyValue("--ember-b") || "").trim() || colB;
    }

    function spawn(anywhere) {
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + 10 + Math.random() * 40,
        r: 0.6 + Math.random() * 1.8,
        vy: 12 + Math.random() * 34,          // px per second, upward
        drift: (Math.random() - 0.5) * 14,
        wob: Math.random() * Math.PI * 2,
        wobSpeed: 0.6 + Math.random() * 1.4,
        a: 0.25 + Math.random() * 0.6,
        hot: Math.random() < 0.35
      };
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.round(Math.min(70, Math.max(22, (W * H) / 26000)));
      while (parts.length < target) parts.push(spawn(true));
      if (parts.length > target) parts.length = target;
    }

    function frame(now) {
      if (!running) return;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      colorClock += dt;
      if (colorClock > 0.4) { colorClock = 0; readColors(); }

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.wob += p.wobSpeed * dt;
        p.y -= p.vy * dt;
        p.x += (p.drift + Math.sin(p.wob) * 10) * dt;

        // fade in from the bottom, out toward the top
        var life = 1 - p.y / H;
        var fade = life < 0.08 ? life / 0.08 : life > 0.75 ? Math.max(0, (1 - life) / 0.25) : 1;
        var alpha = p.a * fade;

        if (p.y < -20 || alpha <= 0.003) { parts[i] = spawn(false); continue; }

        ctx.fillStyle = p.hot ? colB : colA;
        ctx.globalAlpha = alpha * 0.18;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    readColors();
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { running = false; return; }
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    });
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- spotlight
  function initSpotlight() {
    if (reduced || !window.matchMedia("(hover: hover)").matches) return;
    var pending = null, evt = null;
    document.addEventListener("pointermove", function (e) {
      evt = e;
      if (pending) return;
      pending = requestAnimationFrame(function () {
        pending = null;
        var card = evt.target && evt.target.closest ? evt.target.closest(".nf-card") : null;
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (evt.clientX - r.left) + "px");
        card.style.setProperty("--my", (evt.clientY - r.top) + "px");
      });
    }, { passive: true });
  }

  // ---------------------------------------------------------------- header
  function initHeader() {
    var header = document.querySelector(".nf-header");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    // Toasts drop in just below the header, which wraps taller on phones.
    var measure = function () {
      document.documentElement.style.setProperty("--nf-header-h", header.offsetHeight + "px");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(header);
    onScroll();
    measure();
  }

  function boot() {
    startEmbers(injectBackground());
    initSpotlight();
    initHeader();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.NF_FX = {
    reduced: reduced,
    openModal: openModal,
    closeModal: closeModal
  };
})();
