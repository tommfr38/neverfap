// site.js — loaded by every page of every version, plus the pages that live
// outside the version switch (privacy, terms, thank-you, 404).
//
//  1. Legal links: fills any empty [data-nf-legal] element.
//  2. Cookie banner: asks once, remembers the answer on this device. Any
//     [data-nf-consent-open] element reopens it.
//  3. Analytics: anonymous page counts in Supabase (public.page_views), only
//     after the visitor allows them. Sends the page path, language and the
//     referring site's domain. Never a user id, query string or anything typed.
//  4. Mobile CTA: a sticky button while the sign-up form is off screen. Any
//     [data-nf-cta] element jumps to the form.
(function () {
  var CONSENT_KEY = "nf_consent"; // "granted" | "denied"
  var CONTACT = "neverfap@tommfr38.com";
  var root = new URL(".", document.currentScript.src).href;

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }
  // Global Privacy Control counts as a standing "no".
  function gpcOn() {
    return navigator.globalPrivacyControl === true;
  }

  function el(html) {
    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    return wrap.firstElementChild;
  }
  function translate(node) {
    if (window.NF_I18N) window.NF_I18N.apply(node);
  }

  // ----- Legal links -----
  function mountLegalLinks() {
    var hosts = document.querySelectorAll("[data-nf-legal]");
    for (var i = 0; i < hosts.length; i++) {
      hosts[i].classList.add("nfx-legal");
      hosts[i].innerHTML =
        '<a href="' + root + 'privacy.html" data-i18n="site.privacy">Privacy</a>' +
        '<a href="' + root + 'terms.html" data-i18n="site.terms">Terms</a>' +
        '<button type="button" data-nf-consent-open data-i18n="site.cookies">Cookie settings</button>' +
        '<a href="mailto:' + CONTACT + '" data-i18n="site.contact">Contact</a>';
      translate(hosts[i]);
    }
  }

  // ----- Cookie banner -----
  var banner = null;

  function closeBanner() {
    if (banner) banner.remove();
    banner = null;
    document.body.classList.remove("nfx-banner-open");
  }

  function openBanner() {
    if (banner) return;
    banner = el(
      '<section class="nfx-banner" aria-labelledby="nfxBannerTitle">' +
        '<h2 id="nfxBannerTitle" data-i18n="consent.title">Your privacy</h2>' +
        '<p><span data-i18n="consent.text"></span> ' +
        '<a href="' + root + 'privacy.html#cookies" data-i18n="consent.more">Details</a></p>' +
        '<div class="nfx-banner__actions">' +
          '<button type="button" class="nfx-btn" data-choice="denied" data-i18n="consent.reject">Necessary only</button>' +
          '<button type="button" class="nfx-btn" data-choice="granted" data-i18n="consent.accept">Allow anonymous stats</button>' +
        "</div>" +
      "</section>"
    );
    banner.addEventListener("click", function (e) {
      var choice = e.target.getAttribute("data-choice");
      if (!choice) return;
      setConsent(choice);
      closeBanner();
      if (choice === "granted") trackPageView();
    });
    document.body.appendChild(banner);
    document.body.classList.add("nfx-banner-open");
    translate(banner);
  }

  // ----- Analytics -----
  var tracked = false;

  function trackPageView() {
    if (tracked || gpcOn() || getConsent() !== "granted") return;
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
    tracked = true;

    // Waits out maintenance-check.js: a visitor it redirects leaves this page
    // first, so the timer dies with it and only the final page is counted.
    setTimeout(function () {
      // Pages can fix their own path; a 404's real URL could be anything.
      var path = document.body.getAttribute("data-nf-path") || location.pathname;
      if (!/^\/[A-Za-z0-9._\/-]{0,100}$/.test(path)) return;

      var referrer = null;
      try {
        var host = document.referrer ? new URL(document.referrer).hostname : null;
        if (host && host !== location.hostname) referrer = host.slice(0, 100);
      } catch (e) {}

      fetch(window.SUPABASE_URL + "/rest/v1/page_views", {
        method: "POST",
        headers: {
          apikey: window.SUPABASE_ANON_KEY,
          Authorization: "Bearer " + window.SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          path: path,
          lang: window.NF_I18N ? window.NF_I18N.lang() : null,
          referrer_host: referrer
        }),
        keepalive: true
      }).catch(function () {});
    }, 1500);
  }

  // ----- Mobile CTA -----
  function jumpToForm() {
    var email = document.getElementById("email");
    if (!email) return;
    email.scrollIntoView({ behavior: "smooth", block: "center" });
    email.focus({ preventScroll: true });
  }

  function mountStickyCta() {
    var email = document.getElementById("email");
    if (!email || !document.getElementById("viewAuth") || !window.IntersectionObserver) return;

    var bar = el(
      '<div class="nfx-sticky" hidden>' +
        '<button type="button" class="nfx-btn nfx-btn--primary" data-nf-cta data-i18n="cta.start">Start your streak</button>' +
      "</div>"
    );
    document.body.appendChild(bar);
    translate(bar);

    new IntersectionObserver(function (entries) {
      // A hidden form also reports "not intersecting": that's a logged-in
      // visitor, who gets no bar.
      var entry = entries[entries.length - 1];
      var show = !entry.isIntersecting && email.offsetParent !== null;
      bar.hidden = !show;
      document.body.classList.toggle("nfx-sticky-on", show);
    }).observe(email);
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    if (e.target.closest("[data-nf-consent-open]")) {
      e.preventDefault();
      openBanner();
    } else if (e.target.closest("[data-nf-cta]")) {
      e.preventDefault();
      jumpToForm();
    }
  });

  function boot() {
    mountLegalLinks();
    mountStickyCta();
    if (!getConsent() && !gpcOn()) openBanner();
    trackPageView();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
