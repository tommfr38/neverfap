// maintenance-check.js — runs first on every page of every version.
//
//  1. Maintenance mode: site_settings.maintenance_mode sends visitors to the
//     maintenance page.
//  2. Version switch: site_settings.site_version picks the build visitors get.
//       "1.17.2" (or empty) -> the files at the site root
//       "2.0.0"             -> the files in v2/
//     A page on the wrong version is swapped for the same page on the right one
//     (demo.html <-> v2/demo.html), keeping the query string and hash.
//
// Pages built for 2.0.0 load this script with data-version="2.0.0"; untagged
// pages are 1.17.2. The page stays hidden until the check answers, so nobody
// sees a flash of the wrong version.
(function () {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;

  var VERSIONS = { "1.17.2": "", "2.0.0": "v2/" }; // version -> folder
  var DEFAULT_VERSION = "1.17.2";

  var script = document.currentScript;
  var pageVersion = (script && script.getAttribute("data-version")) || DEFAULT_VERSION;

  var bypass = false;
  var preview = null;
  try {
    var params = new URLSearchParams(window.location.search);

    // Admin maintenance bypass: if an admin signed in through the maintenance
    // page, never send them to the maintenance screen for this session.
    // ?nfbp=1 carries the bypass across origins (the destination buttons use it),
    // then it's stored so it survives further same-origin navigation.
    if (params.get("nfbp") === "1") sessionStorage.setItem("nf_maint_bypass", "1");
    bypass = sessionStorage.getItem("nf_maint_bypass") === "1";

    // ?nfv=2.0.0 previews a version in this tab only — e.g. to check a build on
    // the live site before launching it. ?nfv=off returns to the live version.
    var nfv = params.get("nfv");
    if (nfv === "off") sessionStorage.removeItem("nf_version_preview");
    else if (nfv && VERSIONS.hasOwnProperty(nfv)) sessionStorage.setItem("nf_version_preview", nfv);
    preview = sessionStorage.getItem("nf_version_preview");
  } catch (e) {}

  // This file lives at the site root, so its own URL tells us where that is,
  // whatever the host (tommfr38.com/neverfap/, localhost, file://…).
  function rootUrl() {
    return new URL(".", script.src);
  }

  // The current page's path relative to its version folder: "", "demo.html", …
  function pageInVersion() {
    var root = rootUrl().pathname;
    var path = window.location.pathname;
    var rel = path.indexOf(root) === 0 ? path.slice(root.length) : path.split("/").pop();
    var folder = VERSIONS[pageVersion];
    if (folder && rel.indexOf(folder) === 0) rel = rel.slice(folder.length);
    return rel;
  }

  function urlFor(version, page) {
    return new URL(VERSIONS[version] + page, rootUrl()).href + window.location.search + window.location.hash;
  }

  var html = document.documentElement;
  var prevVisibility = html.style.visibility;
  html.style.visibility = "hidden";

  var revealTimer = setTimeout(reveal, 4000);
  function reveal() {
    clearTimeout(revealTimer);
    html.style.visibility = prevVisibility || "";
  }
  function go(url) {
    clearTimeout(revealTimer);
    window.location.replace(url);
  }

  fetch(window.SUPABASE_URL + "/rest/v1/site_settings?select=*&id=eq.1", {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + window.SUPABASE_ANON_KEY
    },
    cache: "no-store"
  })
    .then(function (r) { return r.json(); })
    .then(function (rows) {
      var s = (Array.isArray(rows) && rows[0]) || {};

      var wanted = preview || s.site_version;
      if (!VERSIONS.hasOwnProperty(wanted)) wanted = DEFAULT_VERSION;

      if (s.maintenance_mode === true && !bypass) {
        return go(script ? urlFor(wanted, "maintenance.html") : "./maintenance.html");
      }
      if (script && wanted !== pageVersion) {
        return go(urlFor(wanted, pageInVersion()));
      }
      reveal();
    })
    .catch(reveal);
})();
