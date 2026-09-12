// app.js
(() => {
  // ----- Config sanity -----
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;

  if (!url || !key || String(url).includes("PASTE_") || String(key).includes("PASTE_")) {
    alert("Set SUPABASE_URL and SUPABASE_ANON_KEY in config.js first.");
    return;
  }

  // ✅ Create Supabase client (CDN build)
  const supa = window.supabase.createClient(url, key);

  // Debug helpers
  window.supa = supa;
  window.supaClient = supa;

  // ----- i18n -----
  // i18n.js is a plain global loaded before this file. The fallbacks keep the
  // app running (in English) if it ever fails to load.
  const I18N = window.NF_I18N;
  const t = (key, params) => (I18N ? I18N.t(key, params) : key);
  const fmtDateTime = (value) =>
    I18N ? I18N.dateTime(value) : new Date(value).toLocaleString();
  // Visual layer (fx.js). Optional: without it modals just snap open/shut.
  const FX = window.NF_FX;
  const openModalEl = (el) => {
    if (!el) return;
    if (FX) return FX.openModal(el);
    el.classList.remove("hidden");
    el.classList.add("flex");
  };
  const closeModalEl = (el) => {
    if (!el) return;
    if (FX) return FX.closeModal(el);
    el.classList.add("hidden");
    el.classList.remove("flex");
  };
  // Replays a one-shot CSS animation class.
  const replay = (el, cls, ms) => {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    if (ms) {
      clearTimeout(el["_nf_" + cls]);
      el["_nf_" + cls] = setTimeout(() => el.classList.remove(cls), ms);
    }
  };

  // "1.5" in English, "1,5" in German/French/Spanish/Hungarian.
  const fmtNumber = (value) =>
    I18N ? value.toLocaleString(I18N.locale()) : String(value);

  // ----- Elements -----
  const viewAuth = document.getElementById("viewAuth");
  const viewApp = document.getElementById("viewApp");
  const userEmail = document.getElementById("userEmail");
  const btnSignOut = document.getElementById("btnSignOut");

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const btnLogin = document.getElementById("btnLogin");
  const btnSignup = document.getElementById("btnSignup");
  const btnDemoFill = document.getElementById("btnDemoFill");

  const flameStageEl = document.getElementById("flameStage");
  const elapsedEl = document.getElementById("elapsed");
  const startedAtEl = document.getElementById("startedAt");
  const outerStop1 = document.getElementById("outerStop1");
  const outerStop2 = document.getElementById("outerStop2");
  const innerStop1 = document.getElementById("innerStop1");
  const innerStop2 = document.getElementById("innerStop2");

  // Flame info modal
  const btnFlameInfo = document.getElementById("btnFlameInfo");
  const flameInfoModal = document.getElementById("flameInfoModal");
  const flameInfoBackdrop = document.getElementById("flameInfoBackdrop");
  const btnCloseFlameInfo = document.getElementById("btnCloseFlameInfo");
  const flameInfoList = document.getElementById("flameInfoList");

  const btnStart = document.getElementById("btnStart");
  const btnFailed = document.getElementById("btnFailed");

  const btnPanic = document.getElementById("btnPanic");
  const panicModal = document.getElementById("panicModal");
  const btnClosePanic = document.getElementById("btnClosePanic");

  const confirmFailedModal = document.getElementById("confirmFailedModal");
  const confirmFailedBackdrop = document.getElementById("confirmFailedBackdrop");
  const btnConfirmFailed = document.getElementById("btnConfirmFailed");
  const btnCancelFailed = document.getElementById("btnCancelFailed");

  const diaryText = document.getElementById("diaryText");
  const btnAddEntry = document.getElementById("btnAddEntry");
  const btnClearText = document.getElementById("btnClearText");
  const btnRefreshDiary = document.getElementById("btnRefreshDiary");
  const diaryList = document.getElementById("diaryList");

  // Revamp: flame ring, clock, next stage, stats
  const flameWrap = document.getElementById("flameWrap");
  const stageChip = document.getElementById("stageChip");
  const clockWrap = document.getElementById("clockWrap");
  const clockNums = document.querySelectorAll("[data-clock]");
  const stageRing = document.getElementById("stageRing");
  const nextStageRow = document.getElementById("nextStageRow");
  const nextStageText = document.getElementById("nextStageText");
  const nextStageBar = document.getElementById("nextStageBar");
  const statBest = document.getElementById("statBest");
  const statResets = document.getElementById("statResets");
  const statAch = document.getElementById("statAch");
  const achBadge = document.getElementById("achBadge");
  const achProgressText = document.getElementById("achProgressText");
  const achProgressPct = document.getElementById("achProgressPct");
  const achProgressBar = document.getElementById("achProgressBar");
  const breathStage = document.getElementById("breathStage");

  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toastText");
  const lastSavedText = document.getElementById("lastSavedText");

  // Achievements UI
  const btnAchievements = document.getElementById("btnAchievements");
  const achievementsModal = document.getElementById("achievementsModal");
  const btnCloseAchievements = document.getElementById("btnCloseAchievements");
  const achievementsBackdrop = document.getElementById("achievementsBackdrop");

  // Manual save
  const btnSaveAchievements = document.getElementById("btnSaveAchievements");
  const achSaveHint = document.getElementById("achSaveHint");

  // Forgot password modal
  const btnForgotPassword = document.getElementById("btnForgotPassword");
  const forgotModal = document.getElementById("forgotModal");
  const forgotBackdrop = document.getElementById("forgotBackdrop");
  const btnCloseForgot = document.getElementById("btnCloseForgot");

  // Bug report modal
  const btnBugReport = document.getElementById("btnBugReport");
  const bugReportModal = document.getElementById("bugReportModal");
  const bugReportBackdrop = document.getElementById("bugReportBackdrop");
  const btnCloseBugReport = document.getElementById("btnCloseBugReport");

  // Global popup modal
  const globalPopupModal = document.getElementById("globalPopupModal");
  const globalPopupBackdrop = document.getElementById("globalPopupBackdrop");
  const globalPopupTitle = document.getElementById("globalPopupTitle");
  const globalPopupMessage = document.getElementById("globalPopupMessage");
  const btnCloseGlobalPopup = document.getElementById("btnCloseGlobalPopup");

  // ----- State -----
  let sessionUser = null;
  let startedAt = null;
  let timer = null;
  let autosaveTimer = null;
  let globalPopupTimer = null;
  let dismissedGlobalPopupKey = null;

  // Achievements state (stored in profiles)
  let achievements = {};
  let achievementsDirty = false;
  let failCount = 0;
  // Canonical English stage name — this is what lands in the database, so it
  // must never be translated. Display names go through stageLabel().
  let bestStageName = "Unlit";
  let lastSavedAt = null;
  let diaryData = [];
  // Stage order seen on the previous render — a rise while the page is open
  // triggers the evolve celebration. null = nothing rendered yet.
  let lastStageOrder = null;
  let flameInfoKey = "";

  // ----- Helpers -----
  const on = (el, evt, fn) => {
    if (!el) return;
    el.addEventListener(evt, fn);
  };

  // Toasts queue instead of overwriting each other, so e.g. "Your flame
  // evolved" isn't instantly replaced by the achievement it unlocked.
  const toastQueue = [];
  let toastBusy = false;

  function showToast(msg) {
    if (!toast || !toastText) return;
    if (toastBusy) {
      if (toastQueue[toastQueue.length - 1] !== msg && toastText.textContent !== msg) toastQueue.push(msg);
      if (toastQueue.length > 3) toastQueue.shift();
      return;
    }
    displayToast(msg);
  }

  function displayToast(msg) {
    toastBusy = true;
    toastText.textContent = msg;
    toast.classList.remove("hidden", "is-leaving");
    // Restart the entrance animation for each message.
    toast.style.animation = "none";
    void toast.offsetWidth;
    toast.style.animation = "";
    setTimeout(() => {
      toast.classList.add("is-leaving");
      setTimeout(() => {
        toast.classList.add("hidden");
        toastBusy = false;
        if (toastQueue.length) displayToast(toastQueue.shift());
      }, 300);
    }, toastQueue.length ? 2000 : 2600);
  }

  function setBusy(btn, isBusy) {
    if (!btn) return;
    btn.disabled = isBusy;
    btn.classList.toggle("opacity-60", isBusy);
    btn.classList.toggle("cursor-not-allowed", isBusy);
  }

  function updateLastSavedText(date = null) {
    lastSavedAt = date;
    if (!lastSavedText) return;
    if (!date) {
      lastSavedText.textContent = t("footer.lastSavedEmpty");
      return;
    }

    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    lastSavedText.textContent = t("footer.lastSaved", { time: `${hh}:${mm}:${ss}` });
    replay(lastSavedText, "is-fresh", 1600);
  }

  function stopAutosave() {
    if (autosaveTimer) clearInterval(autosaveTimer);
    autosaveTimer = null;
  }

  async function saveAllNow(showSavedTime = true) {
    if (!sessionUser) return;

    await ensureProfileRow();

    const payload = {
      started_at: startedAt ? startedAt.toISOString() : null,
      achievements,
      fail_count: failCount,
      best_stage: bestStageName,
    };

    const { error } = await supa
      .from("profiles")
      .update(payload)
      .eq("id", sessionUser.id);

    if (error) throw error;

    achievementsDirty = false;
    renderAchievementsUI();

    if (showSavedTime) {
      updateLastSavedText(new Date());
    }
  }

  function startAutosave() {
    stopAutosave();
    autosaveTimer = setInterval(async () => {
      try {
        await saveAllNow(true);
      } catch (e) {
        console.error("Autosave failed:", e);
      }
    }, 5000);
  }

  function fmtDuration(ms) {
    if (I18N) return I18N.duration(ms);

    if (ms < 0) ms = 0;
    const s = Math.floor(ms / 1000);
    const days = Math.floor(s / 86400);
    const hrs = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;

    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  }

  function stageFromMs(ms) {
    const h = ms / 3600000;
    const d = ms / 86400000;

    if (!startedAt) return { name: "Unlit", vibe: "unlit" };
    if (h < 12) return { name: "Spark", vibe: "yellow" };
    if (h < 48) return { name: "Growing", vibe: "orange" };
    if (d < 7) return { name: "Ruby Flame", vibe: "red" };
    if (d < 21) return { name: "Amethyst Flame", vibe: "purple" };
    if (d < 30) return { name: "Diamond Flame", vibe: "blue" };
    if (d < 60) return { name: "Emerald Flame", vibe: "green" };
    return { name: "Platinum Flame", vibe: "platinum" };
  }

// `name` stays English on purpose: it is the value persisted in profiles.best_stage
// and compared against elsewhere. `nameKey`/`rangeKey` drive what the user sees.
const STAGE_ROWS = [
  { name: "Unlit",          nameKey: "stage.unlit",     rangeKey: "range.unlit",     order: 0, vibe: "unlit" },
  { name: "Spark",          nameKey: "stage.spark",     rangeKey: "range.spark",     order: 1, vibe: "yellow" },
  { name: "Growing",        nameKey: "stage.growing",   rangeKey: "range.growing",   order: 2, vibe: "orange" },
  { name: "Ruby Flame",     nameKey: "stage.ruby",      rangeKey: "range.ruby",      order: 3, vibe: "red" },
  { name: "Amethyst Flame", nameKey: "stage.amethyst",  rangeKey: "range.amethyst",  order: 4, vibe: "purple" },
  { name: "Diamond Flame",  nameKey: "stage.diamond",   rangeKey: "range.diamond",   order: 5, vibe: "blue" },
  { name: "Emerald Flame",  nameKey: "stage.emerald",   rangeKey: "range.emerald",   order: 6, vibe: "green" },
  { name: "Platinum Flame", nameKey: "stage.platinum",  rangeKey: "range.platinum",  order: 7, vibe: "platinum" },
];

// Where each lit stage begins, in ms since Start (index = stage order - 1).
// Must agree with stageFromMs().
const HOUR_MS = 3600000;
const DAY_MS = 86400000;
const STAGE_STARTS = [0, 12 * HOUR_MS, 48 * HOUR_MS, 7 * DAY_MS, 21 * DAY_MS, 30 * DAY_MS, 60 * DAY_MS, Infinity];

// Palette per stage. `ember` tints the page glow; outer/inner paint the flame.
const VIBES = {
  unlit:    { ember: ["#64748b", "#94a3b8"], outer: ["#475569", "#64748b"], inner: ["#94a3b8", "#cbd5e1"] },
  yellow:   { ember: ["#f59e0b", "#fde047"], outer: ["#f97316", "#fbbf24"], inner: ["#fde047", "#fef9c3"] },
  orange:   { ember: ["#f97316", "#fbbf24"], outer: ["#dc2626", "#f97316"], inner: ["#fb923c", "#fde047"] },
  red:      { ember: ["#ef4444", "#fb7185"], outer: ["#9333ea", "#ef4444"], inner: ["#f87171", "#fca5a5"] },
  purple:   { ember: ["#a855f7", "#c084fc"], outer: ["#6366f1", "#a855f7"], inner: ["#c084fc", "#e9d5ff"] },
  blue:     { ember: ["#06b6d4", "#67e8f9"], outer: ["#2563eb", "#06b6d4"], inner: ["#67e8f9", "#cffafe"] },
  green:    { ember: ["#22c55e", "#a3e635"], outer: ["#16a34a", "#84cc16"], inner: ["#86efac", "#d9f99d"] },
  platinum: { ember: ["#7dd3fc", "#e0f2fe"], outer: ["#7dc3e4", "#86d9fc"], inner: ["#caedff", "#ddf1ff"] },
};

// Same silhouette as the big flame, for the stage timeline swatches.
const FLAME_OUTER_D = "M50 118 C25 118 9 101 10 79 C11 60 24 49 30 34 C34 24 33 14 29 4 C43 10 55 22 59 36 C62 29 63 22 61 14 C76 26 91 49 90 77 C89 101 74 118 50 118 Z";
const FLAME_INNER_D = "M50 115 C34 115 24 104 25 89 C26 75 36 68 40 56 C42 50 42 44 39 37 C51 43 59 54 60 65 C62 60 63 56 62 50 C71 60 76 74 75 89 C74 104 64 115 50 115 Z";

function getStageInfoRows() {
  return STAGE_ROWS;
}

  function stageLabel(name) {
    const row = STAGE_ROWS.find((r) => r.name === name);
    return row ? t(row.nameKey) : name;
  }
  function renderFlameInfo() {
    if (!flameInfoList) return;

    const rows = getStageInfoRows();

    const currentStageName = startedAt
      ? stageFromMs(Date.now() - startedAt.getTime()).name
      : "Unlit";

    const currentOrder =
      rows.find((r) => r.name === currentStageName)?.order ?? 0;

    const bestOrder =
      rows.find((r) => r.name === bestStageName)?.order ?? 0;

    // renderFlame() calls this every second while the modal is open; only
    // rebuild (and replay the row animation) when something actually changed.
    const key = `${currentOrder}|${bestStageName}|${I18N ? I18N.lang() : ""}`;
    if (key === flameInfoKey && flameInfoList.childElementCount) return;
    flameInfoKey = key;

    flameInfoList.innerHTML = rows
      .map((r, i) => {
        const isCurrent = r.name === currentStageName;
        const isBest = r.name === bestStageName && r.order > 0;
        const state = isCurrent ? "is-current" : r.order < currentOrder ? "is-past" : "is-future";
        const tags =
          (isCurrent ? `<span class="nf-tl-tag nf-tl-tag--current">${t("flameInfo.current").replace(/[()]/g, "")}</span>` : "") +
          (isBest ? `<span class="nf-tl-tag nf-tl-tag--best">${t("flameInfo.best").replace(/[()]/g, "")}</span>` : "");

        return `
          <div class="nf-tl-row ${state}" style="--i:${i}">
            <div class="nf-tl-swatch">${stageSwatch(r.vibe, i)}</div>
            <div class="min-w-0">
              <div class="nf-tl-name">${t(r.nameKey)}</div>
              ${tags ? `<div class="mt-1 flex flex-wrap gap-1.5">${tags}</div>` : ""}
            </div>
            <div class="nf-tl-range">${t(r.rangeKey)}</div>
          </div>
        `;
      })
      .join("");
  }

  function stageSwatch(vibe, i) {
    const v = VIBES[vibe] || VIBES.unlit;
    const id = `sw${i}`;
    return `<svg viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <linearGradient id="${id}o" x1="50" y1="118" x2="50" y2="4" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${v.outer[0]}"/><stop offset="1" stop-color="${v.outer[1]}"/></linearGradient>
        <linearGradient id="${id}i" x1="50" y1="115" x2="50" y2="37" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${v.inner[0]}"/><stop offset="1" stop-color="${v.inner[1]}"/></linearGradient>
      </defs>
      <path fill="url(#${id}o)" d="${FLAME_OUTER_D}"/>
      <path fill="url(#${id}i)" opacity=".9" d="${FLAME_INNER_D}"/>
    </svg>`;
  }

  function openFlameInfo() {
    if (!flameInfoModal) return;
    renderFlameInfo();
    openModalEl(flameInfoModal);
  }

  function closeFlameInfo() {
    if (!flameInfoModal) return;
    closeModalEl(flameInfoModal);
  }

  function openConfirmFailed() {
    if (!confirmFailedModal) return;
    openModalEl(confirmFailedModal);
  }

  function closeConfirmFailed() {
    if (!confirmFailedModal) return;
    closeModalEl(confirmFailedModal);
  }

  function openForgotModal() {
    if (!forgotModal) return;
    openModalEl(forgotModal);
  }

  function closeForgotModal() {
    if (!forgotModal) return;
    closeModalEl(forgotModal);
  }

  function openBugReportModal() {
    if (!bugReportModal) return;
    openModalEl(bugReportModal);
  }

  function closeBugReportModal() {
    if (!bugReportModal) return;
    closeModalEl(bugReportModal);
  }

  // Optional read timer: the admin can lock the popup's Close button for a few
  // seconds so an announcement is actually read. 0 (or empty) = off.
  let popupLockTimer = null;
  let popupLockRemaining = 0;
  let popupLocked = false;
  let shownGlobalPopupKey = null;

  function renderGlobalPopupButton() {
    if (!btnCloseGlobalPopup) return;
    btnCloseGlobalPopup.disabled = popupLocked;
    btnCloseGlobalPopup.classList.toggle("opacity-60", popupLocked);
    btnCloseGlobalPopup.classList.toggle("cursor-not-allowed", popupLocked);
    btnCloseGlobalPopup.textContent = popupLocked
      ? t("popup.closeIn", { n: popupLockRemaining })
      : t("popup.close");
  }

  function stopGlobalPopupLock() {
    clearInterval(popupLockTimer);
    popupLockTimer = null;
    popupLocked = false;
    popupLockRemaining = 0;
  }

  function startGlobalPopupLock(seconds) {
    stopGlobalPopupLock();
    popupLockRemaining = Math.max(0, Math.floor(Number(seconds) || 0));
    popupLocked = popupLockRemaining > 0;
    renderGlobalPopupButton();
    if (!popupLocked) return;
    popupLockTimer = setInterval(() => {
      popupLockRemaining -= 1;
      if (popupLockRemaining <= 0) stopGlobalPopupLock();
      renderGlobalPopupButton();
    }, 1000);
  }

  function openGlobalPopup(title, message, okDelaySeconds) {
    if (!globalPopupModal) return;
    if (globalPopupTitle) {
      globalPopupTitle.removeAttribute("data-i18n");
      globalPopupTitle.textContent = title || t("popup.notice");
    }
    if (globalPopupMessage) {
      globalPopupMessage.removeAttribute("data-i18n");
      globalPopupMessage.textContent = message || "";
    }
    openModalEl(globalPopupModal);
    startGlobalPopupLock(okDelaySeconds);
  }

  function closeGlobalPopup(rememberDismiss = false) {
    if (!globalPopupModal) return;

    // A running read timer blocks the user's own dismissals. Closes we trigger
    // ourselves (popup switched off, sign-out) pass rememberDismiss = false.
    if (rememberDismiss && popupLocked) return;
    stopGlobalPopupLock();
    shownGlobalPopupKey = null;

    if (rememberDismiss) {
      const currentTitle = globalPopupTitle?.textContent || "";
      const currentMessage = globalPopupMessage?.textContent || "";
      dismissedGlobalPopupKey = `${currentTitle}||${currentMessage}`;
    }

    closeModalEl(globalPopupModal);
  }

  function stopGlobalPopupChecks() {
    if (globalPopupTimer) clearInterval(globalPopupTimer);
    globalPopupTimer = null;
  }

  async function checkGlobalPopup() {
    try {
      // select * so an older database without ok_delay_seconds still works.
      const { data, error } = await supa
        .from("global_popup")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        dismissedGlobalPopupKey = null;
        closeGlobalPopup();
        return;
      }

      const popupKey = `${data.title || ""}||${data.message || ""}`;

      if (!data.is_active) {
        dismissedGlobalPopupKey = null;
        closeGlobalPopup();
        return;
      }

      if (dismissedGlobalPopupKey === popupKey) {
        return;
      }

      // Already on screen: don't reopen, that would restart the read timer.
      const isOpen = globalPopupModal && !globalPopupModal.classList.contains("hidden");
      if (isOpen && shownGlobalPopupKey === popupKey) return;

      openGlobalPopup(data.title, data.message, data.ok_delay_seconds);
      shownGlobalPopupKey = popupKey;
    } catch (e) {
      console.error("Global popup check failed:", e);
    }
  }

  function startGlobalPopupChecks() {
    stopGlobalPopupChecks();
    checkGlobalPopup();
    globalPopupTimer = setInterval(checkGlobalPopup, 10000);
  }

  // The whole page takes its colour from the flame: theme.css reads these
  // variables for the flame gradients, the ring, the glow and the ember field,
  // and cross-fades them when the stage changes.
  function applyFlameVibe(vibe) {
    const v = VIBES[vibe] || VIBES.unlit;
    const lit = vibe !== "unlit";

    // Signed-out visitors are on the landing page, which should glow in the
    // brand orange rather than a dormant grey.
    const ambient = sessionUser ? v : VIBES.orange;
    const root = document.documentElement.style;
    root.setProperty("--ember-a", ambient.ember[0]);
    root.setProperty("--ember-b", ambient.ember[1]);
    root.setProperty("--flame-o1", ambient.outer[0]);
    root.setProperty("--flame-o2", ambient.outer[1]);
    root.setProperty("--flame-i1", ambient.inner[0]);
    root.setProperty("--flame-i2", ambient.inner[1]);

    // Attribute fallback for engines that ignore CSS on gradient stops.
    outerStop1?.setAttribute("stop-color", v.outer[0]);
    outerStop2?.setAttribute("stop-color", v.outer[1]);
    innerStop1?.setAttribute("stop-color", v.inner[0]);
    innerStop2?.setAttribute("stop-color", v.inner[1]);

    const litAttr = String(lit);
    [flameWrap, stageChip, clockWrap].forEach((el) => {
      if (el && el.dataset.lit !== litAttr) el.dataset.lit = litAttr;
    });
  }

  function renderClock(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const parts = {
      d: Math.floor(total / 86400),
      h: Math.floor((total % 86400) / 3600),
      m: Math.floor((total % 3600) / 60),
      s: total % 60,
    };
    clockNums.forEach((el) => {
      const value = String(parts[el.dataset.clock]).padStart(2, "0");
      if (el.textContent === value) return;
      el.textContent = value;
      replay(el, "is-tick");
    });
  }

  // "1 d 4 h" / "3 h 12 min" — coarse, for the next-stage countdown.
  function coarseDuration(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    if (d > 0) return `${d}${t("dur.d")} ${h}${t("dur.h")}`;
    if (h > 0) return `${h}${t("dur.h")} ${m}${t("dur.m")}`;
    return `${m}${t("dur.m")} ${sec}${t("dur.s")}`;
  }

  // Ring around the flame + the "next stage" bar both show progress through
  // the current stage.
  function renderStageProgress(ms, order) {
    if (ms == null || !order) {
      if (stageRing) stageRing.style.strokeDashoffset = "100";
      nextStageRow?.classList.add("hidden");
      return;
    }

    const from = STAGE_STARTS[order - 1];
    const to = STAGE_STARTS[order];
    const pct = to === Infinity ? 1 : Math.min(1, Math.max(0, (ms - from) / (to - from)));

    if (stageRing) stageRing.style.strokeDashoffset = String(100 - pct * 100);
    nextStageRow?.classList.remove("hidden");
    if (nextStageBar) nextStageBar.style.width = `${(pct * 100).toFixed(2)}%`;
    if (nextStageText) {
      nextStageText.textContent =
        to === Infinity
          ? t("flame.maxed")
          : t("flame.nextIn", { stage: t(STAGE_ROWS[order + 1].nameKey), time: coarseDuration(to - ms) });
    }
  }

  function unlockedCount() {
    return Object.keys(ACH).filter(isUnlocked).length;
  }

  function renderStats() {
    const total = Object.keys(ACH).length;
    const count = unlockedCount();
    if (statBest) statBest.textContent = bestStageName === "Unlit" ? "—" : stageLabel(bestStageName);
    if (statResets) statResets.textContent = String(failCount || 0);
    if (statAch) statAch.textContent = `${count}/${total}`;
    if (achBadge) {
      achBadge.textContent = `${count}/${total}`;
      achBadge.classList.toggle("nf-badge--muted", count === 0);
    }
  }

  function celebrateStageUp(stageName, vibe) {
    const v = VIBES[vibe] || VIBES.orange;
    replay(flameWrap, "is-evolving", 1700);
    burstConfetti(flameWrap, { colors: [v.ember[0], v.ember[1], v.inner[1], "#fff7ed"], radial: true, count: 34 });
    showToast(t("toast.stageUp", { stage: stageLabel(stageName) }));
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
    stopAutosave();
    stopGlobalPopupChecks();
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      renderFlame();
      evaluateTimeBasedAchievements().catch(() => {});
    }, 1000);
    renderFlame();
    startAutosave();
    startGlobalPopupChecks();
  }

  function renderFlame() {
    // If flame UI isn't on the page, don't crash
    if (!flameStageEl || !elapsedEl || !startedAtEl) return;

    // Grey out Start when flame is already running; grey out Failed when unlit
    if (btnStart) {
      const isLit = !!startedAt;
      btnStart.disabled = isLit;
      btnStart.classList.toggle("opacity-40", isLit);
      btnStart.classList.toggle("cursor-not-allowed", isLit);
    }
    if (btnFailed) {
      const isUnlit = !startedAt;
      btnFailed.disabled = isUnlit;
      btnFailed.classList.toggle("opacity-40", isUnlit);
      btnFailed.classList.toggle("cursor-not-allowed", isUnlit);
    }

    renderStats();

    if (!startedAt) {
      lastStageOrder = sessionUser ? 0 : null;
      flameStageEl.textContent = stageLabel("Unlit");
      elapsedEl.textContent = "—";
      startedAtEl.textContent = t("flame.pressStart");
      renderClock(0);
      renderStageProgress(null, 0);
      applyFlameVibe("unlit");
      return;
    }

    const ms = Date.now() - startedAt.getTime();
    const stage = stageFromMs(ms);

    // Update best stage automatically (Platinum is highest)
    const rows = getStageInfoRows();
    const currentOrder =
      rows.find((r) => r.name === stage.name)?.order ?? 0;
    const bestOrder =
      rows.find((r) => r.name === bestStageName)?.order ?? 0;

    if (currentOrder > bestOrder) {
      bestStageName = stage.name;
      renderStats();
    }

    // Evolved while the page was open (not on first paint, not on ignition).
    if (lastStageOrder !== null && lastStageOrder >= 1 && currentOrder > lastStageOrder) {
      celebrateStageUp(stage.name, stage.vibe);
    }
    lastStageOrder = currentOrder;

    flameStageEl.textContent = stageLabel(stage.name);
    elapsedEl.textContent = fmtDuration(ms);
    startedAtEl.textContent = t("flame.startedAt", { date: fmtDateTime(startedAt) });
    renderClock(ms);
    renderStageProgress(ms, currentOrder);
    applyFlameVibe(stage.vibe);

    if (flameInfoModal && !flameInfoModal.classList.contains("hidden")) {
      renderFlameInfo();
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setView(isAuthed) {
    if (viewAuth) viewAuth.classList.toggle("hidden", isAuthed);
    if (viewApp) viewApp.classList.toggle("hidden", !isAuthed);
    if (btnSignOut) btnSignOut.classList.toggle("hidden", !isAuthed);
    if (userEmail) userEmail.classList.toggle("hidden", !isAuthed);
    if (btnAchievements) btnAchievements.classList.toggle("hidden", !isAuthed);

    if (!isAuthed) {
      if (userEmail) userEmail.textContent = "";
      stopTimer();
      startedAt = null;
      lastStageOrder = null;
      flameInfoKey = "";
      renderFlame();

      diaryData = [];
      if (diaryList) diaryList.innerHTML = "";

      const clawdTrack = document.getElementById("clawdTrack");
      if (clawdTrack) clawdTrack.classList.add("hidden");

      achievements = {};
      achievementsDirty = false;
      failCount = 0;
      bestStageName = "Unlit";
      dismissedGlobalPopupKey = null;
      updateLastSavedText(null);

      renderAchievementsUI();
      closeAchievements();
      closeFlameInfo();
      closeConfirmFailed();
      closeForgotModal();
      closeBugReportModal();
      closeGlobalPopup();
    }
  }

  // ----- Achievements helpers -----
  const ACH = {
    grower: { titleKey: "ach.grower.title" },
    self_control: { titleKey: "ach.self_control.title" },
    part_of_process: { titleKey: "ach.part_of_process.title" },
    never_back_down: { titleKey: "ach.never_back_down.title" },
    month_clean: { titleKey: "ach.month_clean.title" },
    stronger_than_ever: { titleKey: "ach.stronger_than_ever.title" },
  };

  function isUnlocked(key) {
    return !!achievements?.[key]?.unlocked;
  }

  async function unlockAchievement(key) {
    if (!sessionUser) return;
    if (!ACH[key]) return;
    if (isUnlocked(key)) return;

    achievements = achievements || {};
    achievements[key] = {
      unlocked: true,
      unlocked_at: new Date().toISOString(),
    };

    achievementsDirty = true;
    renderAchievementsUI();
    replay(btnAchievements, "is-bump", 700);
    showToast(t("toast.achUnlocked", { title: t(ACH[key].titleKey) }));
  }

  function renderAchievementsUI() {
    const nodes = document.querySelectorAll?.(".achievement");
    if (!nodes) return;

    nodes.forEach((el) => {
      const key = el.getAttribute("data-key");
      const unlocked = isUnlocked(key);
      const unlockedAt = achievements?.[key]?.unlocked_at;

      // theme.css styles locked/unlocked off this attribute.
      el.setAttribute("data-unlocked", unlocked ? "true" : "false");

      const icon =
        el.querySelector(".achIcon") ||
        el.querySelector("[data-ach-icon]") ||
        el.querySelector(".text-xs");

      if (icon) icon.textContent = unlocked ? "✅" : "🔒";

      const meta = el.querySelector(".achMeta") || el.querySelector("[data-ach-meta]");
      if (meta) meta.textContent = unlockedAt ? t("ach.unlockedAt", { date: fmtDateTime(unlockedAt) }) : "";
    });

    if (btnSaveAchievements) {
      btnSaveAchievements.disabled = !achievementsDirty;
      btnSaveAchievements.classList.toggle("opacity-60", !achievementsDirty);
      btnSaveAchievements.classList.toggle("cursor-not-allowed", !achievementsDirty);
      btnSaveAchievements.textContent = achievementsDirty ? t("ach.save") : t("ach.saved");
    }

    if (achSaveHint) {
      achSaveHint.textContent = achievementsDirty ? t("ach.hint") : t("ach.hintDone");
    }

    const total = Object.keys(ACH).length;
    const count = unlockedCount();
    if (achProgressText) achProgressText.textContent = t("ach.progress", { n: count, total });
    if (achProgressPct) achProgressPct.textContent = `${Math.round((count / total) * 100)}%`;
    if (achProgressBar) achProgressBar.style.width = `${(count / total) * 100}%`;
    renderStats();
  }

  function openAchievements() {
    if (!achievementsModal) return;
    openModalEl(achievementsModal);
    renderAchievementsUI();
  }

  function closeAchievements() {
    if (!achievementsModal) return;
    closeModalEl(achievementsModal);
  }

  async function saveAchievementsNow() {
    if (!sessionUser) return;
    await saveAllNow(true);
    showToast(t("toast.saved"));
  }

  // ----- Supabase calls -----
  async function ensureProfileRow() {
    if (!sessionUser) return;
    const { error } = await supa.from("profiles").upsert({ id: sessionUser.id }, { onConflict: "id" });
    if (error) throw error;
  }

  async function loadProfile() {
    await ensureProfileRow();

    const { data, error } = await supa
      .from("profiles")
      .select("started_at, achievements, fail_count, best_stage")
      .eq("id", sessionUser.id)
      .single();

    if (error) throw error;

    startedAt = data?.started_at ? new Date(data.started_at) : null;
    achievements = data?.achievements || {};
    failCount = Number.isFinite(data?.fail_count) ? data.fail_count : 0;
    bestStageName = data?.best_stage || "Unlit";
    achievementsDirty = false;
    updateLastSavedText(null);

    renderAchievementsUI();
    startTimer();
    await evaluateTimeBasedAchievements(true);
  }

  async function setStartedNow() {
    await ensureProfileRow();

    const { data, error } = await supa
      .from("profiles")
      .update({ started_at: new Date().toISOString() })
      .eq("id", sessionUser.id)
      .select("started_at")
      .single();

    if (error) throw error;

    startedAt = data?.started_at ? new Date(data.started_at) : null;
    updateLastSavedText(new Date());
    renderFlame();
    await evaluateTimeBasedAchievements(true);
  }

  async function clearStartedAt() {
    await ensureProfileRow();

    const { error } = await supa
      .from("profiles")
      .update({ started_at: null })
      .eq("id", sessionUser.id);

    if (error) throw error;

    startedAt = null;
    updateLastSavedText(new Date());
    renderFlame();
  }

  async function incrementFailCountAndSave() {
    failCount = (failCount || 0) + 1;

    const { error } = await supa.from("profiles").update({ fail_count: failCount }).eq("id", sessionUser.id);
    if (error) throw error;

    if (failCount >= 1) await unlockAchievement("part_of_process");
    if (failCount >= 5) await unlockAchievement("never_back_down");
  }

  async function evaluateTimeBasedAchievements(force = false) {
    if (!sessionUser || !startedAt) return;

    const ms = Date.now() - startedAt.getTime();
    const d = ms / 86400000;
    const h = ms / 3600000;

    if ((force || !isUnlocked("grower")) && h >= 12) await unlockAchievement("grower");
    if ((force || !isUnlocked("month_clean")) && d >= 30) await unlockAchievement("month_clean");
    if ((force || !isUnlocked("stronger_than_ever")) && d >= 60) await unlockAchievement("stronger_than_ever");
  }

  async function loadDiary() {
    if (!diaryList) return;

    const { data, error } = await supa
      .from("diary_entries")
      .select("id, created_at, text")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    diaryData = data || [];
    renderDiary();
  }

  function renderDiary() {
    if (!diaryList) return;

    diaryList.innerHTML = "";
    if (!diaryData.length) {
      diaryList.innerHTML =
        `<div class="nf-empty"><svg class="i"><use href="#i-feather"/></svg><span>${t("diary.empty")}</span></div>`;
      return;
    }

    diaryData.forEach((entry, i) => {
      const wrap = document.createElement("div");
      wrap.className = "nf-entry";
      wrap.style.setProperty("--i", String(Math.min(i, 10)));

      const when = fmtDateTime(entry.created_at);
      const del = escapeHtml(t("diary.delete"));

      wrap.innerHTML = `
        <div class="flex items-center justify-between gap-3">
          <div class="nf-faint tnum text-[11.5px] font-semibold">${when}</div>
          <button data-id="${entry.id}" type="button" title="${del}" aria-label="${del}"
            class="btnDel nf-btn nf-btn--quiet nf-btn--sm nf-btn--icon" style="--btn-h:30px">
            <svg class="i i--sm"><use href="#i-trash"/></svg>
          </button>
        </div>
        <div class="mt-1 whitespace-pre-wrap break-words text-[14.5px] leading-relaxed" style="color:var(--ink)">${escapeHtml(entry.text)}</div>
      `;

      diaryList.appendChild(wrap);
    });

    document.querySelectorAll(".btnDel").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          setBusy(btn, true);
          const id = btn.getAttribute("data-id");
          const { error } = await supa.from("diary_entries").delete().eq("id", id);
          if (error) throw error;
          showToast(t("toast.entryDeleted"));
          await loadDiary();
        } catch (e) {
          showToast(t("toast.deleteFailed", { msg: e.message }));
        } finally {
          setBusy(btn, false);
        }
      });
    });
  }

  async function addDiaryEntry(text) {
    const { error } = await supa.from("diary_entries").insert({ user_id: sessionUser.id, text });
    if (error) throw error;
  }

  // ----- Auth handlers -----
  async function init() {
    const { data } = await supa.auth.getSession();
    sessionUser = data?.session?.user || null;

    if (sessionUser) {
      setView(true);
      updateLastSavedText(null);
      if (userEmail) userEmail.textContent = sessionUser.email;
      await loadProfile().catch((e) => showToast(t("toast.profileLoadFailed", { msg: e.message })));
      await loadDiary().catch((e) => showToast(t("toast.diaryLoadFailed", { msg: e.message })));
      await checkGlobalPopup();
    } else {
      setView(false);
    }

    supa.auth.onAuthStateChange(async (_event, session) => {
      sessionUser = session?.user || null;

      if (sessionUser) {
        setView(true);
        updateLastSavedText(null);
        if (userEmail) userEmail.textContent = sessionUser.email;
        await loadProfile().catch((e) => showToast(t("toast.profileLoadFailed", { msg: e.message })));
        await loadDiary().catch((e) => showToast(t("toast.diaryLoadFailed", { msg: e.message })));
        await checkGlobalPopup();
      } else {
        setView(false);
      }
    });
  }

  // ----- UI events -----
  on(btnDemoFill, "click", () => (window.location.href = "./demo.html"));

  on(btnSignup, "click", async () => {
    try {
      setBusy(btnSignup, true);
      const email = (emailEl?.value || "").trim();
      const password = passEl?.value || "";
      const { error } = await supa.auth.signUp({ email, password });
      if (error) throw error;
      showToast(t("toast.signedUp"));
    } catch (e) {
      showToast(t("toast.signupFailed", { msg: e.message }));
    } finally {
      setBusy(btnSignup, false);
    }
  });

  on(btnLogin, "click", async () => {
    try {
      setBusy(btnLogin, true);
      const email = (emailEl?.value || "").trim();
      const password = passEl?.value || "";
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast(t("toast.welcome"));
    } catch (e) {
      showToast(t("toast.loginFailed", { msg: e.message }));
    } finally {
      setBusy(btnLogin, false);
    }
  });

  // Enter in either field logs in.
  [emailEl, passEl].forEach((el) =>
    on(el, "keydown", (e) => {
      if (e.key === "Enter" && btnLogin && !btnLogin.disabled) btnLogin.click();
    })
  );

  on(btnSignOut, "click", async () => {
    try {
      setBusy(btnSignOut, true);
      stopAutosave();
      const { error } = await supa.auth.signOut();
      if (error) throw error;
      showToast(t("toast.signedOut"));
    } catch (e) {
      showToast(t("toast.signOutFailed", { msg: e.message }));
      console.error(e);
    } finally {
      setBusy(btnSignOut, false);
    }
  });

  on(btnStart, "click", async () => {
    try {
      setBusy(btnStart, true);
      await setStartedNow();
      replay(flameWrap, "is-igniting", 1400);
      burstConfetti(flameWrap, { colors: ["#fbbf24", "#f97316", "#fde68a", "#fff7ed"], radial: true, count: 30 });
      showToast(t("toast.flameLit"));
    } catch (e) {
      showToast(t("toast.startFailed", { msg: e.message }));
    } finally {
      renderFlame();
    }
  });

  on(btnFailed, "click", () => openConfirmFailed());

  on(btnConfirmFailed, "click", async () => {
    closeConfirmFailed();
    try {
      setBusy(btnFailed, true);
      await incrementFailCountAndSave();
      await clearStartedAt();
      showToast(t("toast.failOk"));
    } catch (e) {
      showToast(t("toast.resetFailed", { msg: e.message }));
    } finally {
      setBusy(btnFailed, false);
    }
  });

  on(btnCancelFailed, "click", closeConfirmFailed);
  on(confirmFailedBackdrop, "click", closeConfirmFailed);

  // ----- Panic mode -----
  const BREATH_PHASES = [
    { labelKey: "breath.in", seconds: 4, scale: 1.35 },
    { labelKey: "breath.hold", seconds: 4, scale: 1.35 },
    { labelKey: "breath.out", seconds: 4, scale: 0.75 },
    { labelKey: "breath.hold", seconds: 4, scale: 0.75 },
  ];

  const CHALLENGES = [
    { emoji: "💪", nameKey: "chal.pushups", seconds: 60 },
    { emoji: "🧘", nameKey: "chal.plank", seconds: 60 },
    { emoji: "🏃", nameKey: "chal.sprint", seconds: 120 },
    { emoji: "🚿", nameKey: "chal.cold", seconds: 30 },
    { emoji: "🪑", nameKey: "chal.squats", seconds: 90 },
    { emoji: "🧊", nameKey: "chal.still", seconds: 120 },
  ];

  const QUICK_HITS = [
    { emoji: "🥄", textKey: "hits.sugar" },
    { emoji: "🧊", textKey: "hits.cold" },
    { emoji: "🎵", textKey: "hits.song" },
    { emoji: "🚶", textKey: "hits.walk" },
    { emoji: "☕", textKey: "hits.drink" },
    { emoji: "🪟", textKey: "hits.window" },
    { emoji: "🧹", textKey: "hits.tidy" },
    { emoji: "📞", textKey: "hits.text" },
  ];

  let breathTimer = null;
  let breathPhaseIdx = 0;
  let breathRemaining = 0;
  let breathCycles = 0;
  let challengeTimer = null;
  let activeChallenge = null;

  const breathPhaseEl = document.getElementById("breathPhase");
  const breathCountEl = document.getElementById("breathCount");
  const breathCyclesEl = document.getElementById("breathCycles");
  const btnBreathToggle = document.getElementById("btnBreathToggle");
  const breathVisuals = ["breathCircle", "breathRing", "breathGlow"].map((id) =>
    document.getElementById(id)
  );

  const challengePicker = document.getElementById("challengePicker");
  const challengeRunner = document.getElementById("challengeRunner");
  const challengeDone = document.getElementById("challengeDone");
  const challengeListEl = document.getElementById("challengeList");
  const challengeNameEl = document.getElementById("challengeName");
  const challengeTimeEl = document.getElementById("challengeTime");
  const challengeArc = document.getElementById("challengeArc");
  const hitsListEl = document.getElementById("hitsList");

  const ARC_LENGTH = 326.7;

  function setPanicTab(name) {
    document.querySelectorAll("[data-panic-tab]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.panicTab === name);
    });
    document.querySelectorAll("[data-panic-panel]").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.panicPanel !== name);
    });
    if (name !== "breathe") stopBreathing();
    if (name !== "challenge") stopChallenge();
  }

  function applyBreathVisual(scale, seconds) {
    breathVisuals.forEach((el) => {
      if (!el) return;
      el.style.transitionDuration = `${seconds}s`;
      el.style.transform = `scale(${scale})`;
    });
  }

  function stopBreathing() {
    clearInterval(breathTimer);
    breathTimer = null;
    breathStage?.classList.remove("is-breathing");
    if (btnBreathToggle) btnBreathToggle.textContent = t("breath.start");
    if (breathPhaseEl) breathPhaseEl.textContent = t("breath.ready");
    if (breathCountEl) breathCountEl.textContent = "4";
    applyBreathVisual(1, 0.4);
  }

  function enterBreathPhase(idx) {
    breathPhaseIdx = idx;
    const phase = BREATH_PHASES[idx];
    breathRemaining = phase.seconds;
    if (breathPhaseEl) breathPhaseEl.textContent = t(phase.labelKey);
    if (breathCountEl) breathCountEl.textContent = String(phase.seconds);
    applyBreathVisual(phase.scale, phase.seconds);
  }

  function startBreathing() {
    breathCycles = 0;
    if (breathCyclesEl) breathCyclesEl.textContent = t("breath.cycles", { n: 0 });
    if (btnBreathToggle) btnBreathToggle.textContent = t("breath.stop");
    breathStage?.classList.add("is-breathing");
    enterBreathPhase(0);
    breathTimer = setInterval(() => {
      breathRemaining -= 1;
      if (breathRemaining > 0) {
        if (breathCountEl) breathCountEl.textContent = String(breathRemaining);
        return;
      }
      const next = (breathPhaseIdx + 1) % BREATH_PHASES.length;
      if (next === 0) {
        breathCycles += 1;
        if (breathCyclesEl) breathCyclesEl.textContent = t("breath.cycles", { n: breathCycles });
      }
      enterBreathPhase(next);
    }, 1000);
  }

  // radial: burst outward from the middle (flame); otherwise fall like a shower.
  function burstConfetti(host, opts = {}) {
    if (!host || (FX && FX.reduced)) return;
    const colors = opts.colors || ["#ef4444", "#f87171", "#fb923c", "#fbbf24", "#fecaca"];
    const count = opts.count || 28;
    for (let i = 0; i < count; i++) {
      const bit = document.createElement("div");
      bit.className = "confetti-bit";
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 110;
      bit.style.left = opts.radial ? "50%" : `${50 + (Math.random() - 0.5) * 40}%`;
      bit.style.top = opts.radial ? "45%" : "20%";
      bit.style.background = colors[i % colors.length];
      if (Math.random() < 0.35) bit.style.borderRadius = "50%";
      bit.style.setProperty("--dx", `${opts.radial ? Math.cos(angle) * dist : (Math.random() - 0.5) * 240}px`);
      bit.style.setProperty("--dy", `${opts.radial ? Math.sin(angle) * dist : 80 + Math.random() * 100}px`);
      bit.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
      bit.style.animationDelay = `${Math.random() * 0.12}s`;
      host.appendChild(bit);
      setTimeout(() => bit.remove(), 1600);
    }
  }

  function showChallengeStage(stage) {
    challengePicker?.classList.toggle("hidden", stage !== "pick");
    challengeRunner?.classList.toggle("hidden", stage !== "run");
    challengeDone?.classList.toggle("hidden", stage !== "done");
  }

  function stopChallenge() {
    clearInterval(challengeTimer);
    challengeTimer = null;
    activeChallenge = null;
    showChallengeStage("pick");
  }

  function startChallenge(challenge) {
    clearInterval(challengeTimer);
    // Deadline-based so a throttled or backgrounded tab can't stretch the timer.
    const endsAt = Date.now() + challenge.seconds * 1000;
    activeChallenge = challenge;
    if (challengeNameEl) challengeNameEl.textContent = `${challenge.emoji}  ${t(challenge.nameKey)}`;
    showChallengeStage("run");

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      if (challengeTimeEl) challengeTimeEl.textContent = `${mins}:${String(secs).padStart(2, "0")}`;
      if (challengeArc) {
        const progress = remaining / challenge.seconds;
        challengeArc.style.strokeDashoffset = String(ARC_LENGTH * (1 - progress));
      }
      if (remaining > 0) return;
      clearInterval(challengeTimer);
      challengeTimer = null;
      activeChallenge = null;
      showChallengeStage("done");
      burstConfetti(challengeDone);
      showToast(t("toast.challengeDone"));
    };
    tick();
    challengeTimer = setInterval(tick, 250);
  }

  function challengeDurationLabel(c) {
    return c.seconds >= 60
      ? `${fmtNumber(c.seconds / 60)}${t("dur.m")}`
      : `${c.seconds}${t("dur.s")}`;
  }

  function buildPanicLists() {
    if (challengeListEl && !challengeListEl.childElementCount) {
      CHALLENGES.forEach((c, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nf-choice";
        btn.style.setProperty("--i", String(i));
        btn.innerHTML =
          `<span class="nf-choice__emoji">${c.emoji}</span>` +
          `<span class="nf-choice__label flex-1">${t(c.nameKey)}</span>` +
          `<span class="nf-choice__meta">${challengeDurationLabel(c)}</span>`;
        btn.addEventListener("click", () => startChallenge(c));
        challengeListEl.appendChild(btn);
      });
    }

    if (hitsListEl && !hitsListEl.childElementCount) {
      QUICK_HITS.forEach((h, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nf-choice";
        btn.style.setProperty("--i", String(i));
        btn.innerHTML =
          `<span class="nf-choice__emoji">${h.emoji}</span>` +
          `<span class="nf-choice__label flex-1">${t(h.textKey)}</span>` +
          `<span class="nf-choice__check"><svg class="i"><use href="#i-check"/></svg></span>`;
        let done = false;
        btn.addEventListener("click", () => {
          done = !done;
          btn.classList.toggle("is-done", done);
          btn.setAttribute("aria-pressed", String(done));
          if (done) replay(btn, "hit-pop");
        });
        hitsListEl.appendChild(btn);
      });
    }
  }

  // The panic lists are built once and kept; on a language switch only their
  // labels change, so the ticked quick-fixes survive.
  function relabelPanicLists() {
    const relabel = (host, source, key) => {
      if (!host) return;
      host.querySelectorAll("button").forEach((btn, i) => {
        const label = btn.querySelector("span.flex-1");
        if (label && source[i]) label.textContent = t(source[i][key]);
      });
    };
    relabel(challengeListEl, CHALLENGES, "nameKey");
    relabel(hitsListEl, QUICK_HITS, "textKey");

    if (challengeListEl) {
      challengeListEl.querySelectorAll("button").forEach((btn, i) => {
        if (CHALLENGES[i]) btn.lastElementChild.textContent = challengeDurationLabel(CHALLENGES[i]);
      });
    }
  }

  function closePanic() {
    if (!panicModal) return;
    stopBreathing();
    stopChallenge();
    closeModalEl(panicModal);
  }

  on(btnPanic, "click", async () => {
    if (panicModal) {
      buildPanicLists();
      setPanicTab("breathe");
      if (breathCyclesEl) breathCyclesEl.textContent = t("breath.cycles", { n: breathCycles });
      openModalEl(panicModal);
    }
    try {
      await unlockAchievement("self_control");
    } catch (e) {
      console.error(e);
    }
  });

  on(btnClosePanic, "click", closePanic);

  document.querySelectorAll("[data-panic-tab]").forEach((btn) => {
    btn.addEventListener("click", () => setPanicTab(btn.dataset.panicTab));
  });

  on(btnBreathToggle, "click", () => {
    if (breathTimer) stopBreathing();
    else startBreathing();
  });

  on(document.getElementById("btnChallengeCancel"), "click", stopChallenge);
  on(document.getElementById("btnChallengeAgain"), "click", () => showChallengeStage("pick"));

  on(btnClearText, "click", () => {
    if (!diaryText) return;
    diaryText.value = "";
    diaryText.focus();
  });

  on(btnAddEntry, "click", async () => {
    const text = (diaryText?.value || "").trim();
    if (!text) return showToast(t("toast.writeFirst"));
    if (text.toLowerCase() === "i miss clawd") {
      const clawdTrack = document.getElementById("clawdTrack");
      if (clawdTrack) clawdTrack.classList.remove("hidden");
      diaryText.value = "";
      return showToast(t("toast.clawdBack"));
    }
    try {
      setBusy(btnAddEntry, true);
      await addDiaryEntry(text);
      if (diaryText) diaryText.value = "";
      showToast(t("toast.entrySaved"));
      await loadDiary();
    } catch (e) {
      showToast(t("toast.saveFailed", { msg: e.message }));
    } finally {
      setBusy(btnAddEntry, false);
    }
  });

  on(btnRefreshDiary, "click", async () => {
    try {
      setBusy(btnRefreshDiary, true);
      await loadDiary();
      showToast(t("toast.diaryRefreshed"));
    } catch (e) {
      showToast(t("toast.refreshFailed", { msg: e.message }));
    } finally {
      setBusy(btnRefreshDiary, false);
    }
  });

  // Achievements wiring
  on(btnAchievements, "click", openAchievements);
  on(btnCloseAchievements, "click", closeAchievements);
  on(achievementsBackdrop, "click", closeAchievements);

  // Flame info wiring
  on(btnFlameInfo, "click", openFlameInfo);
  on(btnCloseFlameInfo, "click", closeFlameInfo);
  on(flameInfoBackdrop, "click", closeFlameInfo);

  // Forgot password wiring
  on(btnForgotPassword, "click", openForgotModal);
  on(btnCloseForgot, "click", closeForgotModal);
  on(forgotBackdrop, "click", closeForgotModal);

  // Bug report wiring
  on(btnBugReport, "click", openBugReportModal);
  on(btnCloseBugReport, "click", closeBugReportModal);
  on(bugReportBackdrop, "click", closeBugReportModal);

  // Global popup wiring
  on(btnCloseGlobalPopup, "click", () => closeGlobalPopup(true));
  on(globalPopupBackdrop, "click", () => closeGlobalPopup(true));

  // ESC closes modals
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeFlameInfo();
    closeAchievements();
    closeConfirmFailed();
    closeForgotModal();
    closeBugReportModal();
    closeGlobalPopup(true);
    if (panicModal && !panicModal.classList.contains("hidden")) closePanic();
  });

  on(btnSaveAchievements, "click", async () => {
    try {
      setBusy(btnSaveAchievements, true);
      await saveAchievementsNow();
    } catch (e) {
      showToast(t("toast.saveFailed", { msg: e.message }));
      console.error(e);
    } finally {
      setBusy(btnSaveAchievements, false);
    }
  });

  // Save immediately when the tab becomes visible again (counters browser throttling of intervals)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && sessionUser) {
      saveAllNow(true).catch((e) => console.error("Visibility save failed:", e));
    }
  });

  // ----- Language switching -----
  // i18n.js swaps everything carrying a data-i18n attribute; this covers the
  // rest — anything this file writes into the DOM at runtime.
  if (I18N) {
    I18N.onChange(() => {
      renderFlame();
      renderAchievementsUI();
      renderGlobalPopupButton();
      renderStats();
      if (flameInfoModal && !flameInfoModal.classList.contains("hidden")) renderFlameInfo();
      renderDiary();
      relabelPanicLists();
      updateLastSavedText(lastSavedAt);

      if (breathPhaseEl) {
        breathPhaseEl.textContent = breathTimer
          ? t(BREATH_PHASES[breathPhaseIdx].labelKey)
          : t("breath.ready");
      }
      if (btnBreathToggle) {
        btnBreathToggle.textContent = breathTimer ? t("breath.stop") : t("breath.start");
      }
      if (breathCyclesEl) breathCyclesEl.textContent = t("breath.cycles", { n: breathCycles });

      if (activeChallenge && challengeNameEl) {
        challengeNameEl.textContent = `${activeChallenge.emoji}  ${t(activeChallenge.nameKey)}`;
      }
    });
  }

  // go
  init();
})();
