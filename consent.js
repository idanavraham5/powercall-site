/* ============================================================================
   הסכמת עוגיות — consent layer for powercall.co.il

   WHAT ISRAELI LAW ACTUALLY REQUIRES HERE (verified Aug 2026, kept in the code
   so nobody "simplifies" this away later):
   - There is NO statutory cookie-banner duty in Israeli law. The duty comes
     from חוק הגנת הפרטיות התשמ"א-1981 as amended by תיקון 13 (in force
     14.8.2025), and from the PPA's גילוי דעת on consent (25.2.2026), which
     prefers active opt-in over opt-out.
   - This site stores what it needs to work without asking: the visitor's
     accessibility settings and the consent choice made here. For that, consent
     is not legally required — transparency is. It ALSO runs a Meta pixel, which
     is an advertising tracker and therefore does require consent; it is gated on
     the `marketing` category and loads only after an explicit yes.
   - Every user-facing sentence in this file states the site's ACTUAL current
     state. When a tracker is added or removed, the bar copy and the dialog
     paragraph below change in the same commit as the code — a stale reassurance
     here is a false statement, which is exactly the exposure תיקון 13 creates.
   - So the banner below tells the truth about the current state AND records a
     choice that will bind any tracker added later. Non-essential categories are
     OFF by default and are marked as not currently in use, because claiming to
     collect consent for something that does not exist would itself be a false
     statement.

   FOR WHOEVER ADDS ANALYTICS LATER — this is the whole contract:
       if (window.pcConsent && window.pcConsent.allows('analytics')) { ...load... }
       window.pcConsent.onChange(function (s) { ... });
   Never load a non-essential script outside that gate, and update the privacy
   policy's sections 2.6 / 4.2 / 9 the same day.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__ckBooted) return;
  window.__ckBooted = true;

  var KEY = "pc-consent-v1";
  var VERSION = 1;              // bump when the wording materially changes
  var CATS = [
    { id: "necessary", name: "עוגיות הכרחיות", locked: true, inUse: true,
      desc: "נדרשות לתפעול התקין של האתר, לשמירת הגדרות הנגישות שבחרת ולזכירת בחירתך במסך זה. אינן משמשות למעקב ואי אפשר לכבותן." },
    { id: "preferences", name: "עוגיות העדפות", locked: false, inUse: false,
      desc: "זוכרות בחירות שביצעת באתר, כדי שלא תצטרך להגדיר אותן מחדש בכל ביקור." },
    { id: "analytics", name: "עוגיות סטטיסטיקה וביצועים", locked: false, inUse: false,
      desc: "מסייעות להבין כיצד נעשה שימוש באתר — אילו עמודים נצפים ואיפה יש תקלות — לצורך שיפורו." },
    { id: "marketing", name: "עוגיות שיווק ופרסום", locked: false, inUse: true,
      desc: "בשימוש: פיקסל של Meta (פייסבוק ואינסטגרם). נטען רק אם תאשר, ומאפשר לנו למדוד אילו מודעות הביאו פניות ולהציג מודעות למי שכבר ביקר באתר. אם לא תאשר — הפיקסל לא ייטען כלל ולא יישלח מידע ל-Meta." }
  ];

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw || raw.v !== VERSION) return null;
      return raw;
    } catch (e) { return null; }
  }
  function save(state) {
    var rec = { v: VERSION, at: new Date().toISOString(), cats: state };
    try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
    current = rec;
    listeners.forEach(function (fn) { try { fn(state); } catch (e) {} });
  }

  var current = load();
  var listeners = [];

  function allowed() {
    var out = { necessary: true };
    CATS.forEach(function (c) { if (!c.locked) out[c.id] = !!(current && current.cats && current.cats[c.id]); });
    return out;
  }

  /* ---------------------------------------------------------------- markup */
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }

  var bar = el("div", { "class": "ck-bar", id: "ckBar", role: "region",
    "aria-label": "הודעה על שימוש בעוגיות", "data-open": "false" });
  /* Deliberately short: injected on DOMContentLoaded, this paragraph was at one
     point the largest text block on chatflow.html and podium.html, which made a
     late-appearing cookie notice the Largest Contentful Paint on the two pages
     that sell. If this copy grows, re-measure LCP before shipping.

     It must also stay TRUE. An earlier version of this line said "אין באתר
     עוגיות מעקב, ניתוח או פרסום" — which was accurate when it was written and
     became false the moment the Meta pixel landed, leaving the bar contradicting
     the marketing category listed directly beneath it. Whenever a tracker is
     added or removed, this sentence is part of the change. */
  bar.innerHTML =
    '<div class="ck-in">' +
      '<p class="ck-txt">אתר זה שומר בדפדפן מידע הכרחי בלבד. רק באישורך ייטען גם פיקסל של Meta ' +
      'למדידת פרסום. ' +
      '<a href="/privacy.html">מדיניות הפרטיות</a></p>' +
      '<div class="ck-acts">' +
        '<button type="button" class="ck-btn solid" data-ck="all">אישור הכל</button>' +
        '<button type="button" class="ck-btn" data-ck="none">דחיית הכל</button>' +
        '<button type="button" class="ck-btn plain" data-ck="prefs">הגדרות עוגיות</button>' +
      '</div>' +
    '</div>';

  var modal = el("div", { "class": "ck-modal", id: "ckModal", role: "dialog",
    "aria-modal": "true", "aria-labelledby": "ckTitle", "data-open": "false" });
  var catsHtml = CATS.map(function (c) {
    return '<div class="ck-cat">' +
      '<div class="ck-catTop">' +
        '<span class="ck-catName">' + c.name +
          (c.locked ? '<span class="ck-tag">פעיל תמיד</span>'
                    : (c.inUse ? '' : '<span class="ck-tag">לא בשימוש באתר כרגע</span>')) +
        '</span>' +
        '<label class="ck-sw">' +
          '<input type="checkbox" data-cat="' + c.id + '"' + (c.locked ? ' checked disabled' : '') +
            ' aria-label="' + c.name + '">' +
          '<i aria-hidden="true"></i>' +
        '</label>' +
      '</div>' +
      '<p class="ck-catDesc">' + c.desc + '</p>' +
    '</div>';
  }).join("");
  modal.innerHTML =
    '<div class="ck-doc">' +
      '<div class="ck-head">' +
        '<h2 id="ckTitle">הגדרות עוגיות</h2>' +
        '<button class="ck-x" type="button" data-ck="close" aria-label="סגירת הגדרות העוגיות">✕</button>' +
      '</div>' +
      '<div class="ck-body">' +
        '<p>כאן תוכל לבחור אילו סוגי עוגיות מותר לאתר להפעיל. עוגיות הכרחיות פועלות תמיד, ובלעדיהן האתר לא יפעל כראוי. ' +
          'כל שאר הקטגוריות כבויות כברירת מחדל ויופעלו רק אם תבחר בכך. ' +
          'כיום האתר משתמש בפיקסל של Meta בקטגוריית השיווק בלבד — הוא נטען רק אם תאשר אותה, ואם לא תאשר לא נשלח אליה דבר. ' +
          'שאר הקטגוריות אינן בשימוש כרגע, ומוצגות כדי שבחירתך תחול מראש גם על כלים שיתווספו בעתיד.</p>' +
        catsHtml +
        '<div class="ck-foot">' +
          '<button type="button" class="ck-btn solid" data-ck="save">שמירת הבחירה</button>' +
          '<button type="button" class="ck-btn" data-ck="all">אישור הכל</button>' +
          '<button type="button" class="ck-btn" data-ck="none">דחיית הכל</button>' +
        '</div>' +
        '<p class="ck-note">אפשר לשנות את הבחירה בכל עת דרך הקישור "הגדרות עוגיות" שבתחתית האתר. ' +
          'סגירת החלון או גלילה בעמוד אינן נחשבות הסכמה.</p>' +
      '</div>' +
    '</div>';

  var toast = el("div", { "class": "ck-toast", role: "status", "aria-live": "polite", "data-open": "false" }, "הבחירה שלך נשמרה.");

  /* ------------------------------------------------------------ behaviour */
  var lastFocus = null;

  function focusables(root) {
    return Array.prototype.filter.call(
      root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'),
      function (n) { return n.offsetParent !== null; });
  }
  function trap(e, root) {
    if (e.key !== "Tab") return;
    var f = focusables(root); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* The bar overlaps the accessibility button and the WhatsApp float, both of
     which sit lower in the stacking order. Publish the bar's real height so
     consent.css can lift them clear of it; see the note at the end of that
     file. Measured rather than hardcoded because the height depends on how the
     Hebrew wraps at the current width. */
  function syncBarHeight() {
    var open = bar.getAttribute("data-open") === "true";
    var root = document.documentElement;
    if (!open) { root.removeAttribute("data-ck-bar"); root.style.removeProperty("--ck-h"); return; }
    var h = Math.ceil(bar.getBoundingClientRect().height);
    root.style.setProperty("--ck-h", (h ? h + 12 : 0) + "px");
    root.setAttribute("data-ck-bar", "open");
  }

  function showBar(on) {
    bar.setAttribute("data-open", on ? "true" : "false");
    syncBarHeight();
  }
  function openPrefs() {
    lastFocus = document.activeElement;
    var a = allowed();
    modal.querySelectorAll("input[data-cat]").forEach(function (i) {
      if (!i.disabled) i.checked = !!a[i.getAttribute("data-cat")];
    });
    modal.setAttribute("data-open", "true");
    var f = focusables(modal); if (f.length) f[0].focus();
  }
  function closePrefs() {
    modal.setAttribute("data-open", "false");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function flash() {
    toast.setAttribute("data-open", "true");
    setTimeout(function () { toast.setAttribute("data-open", "false"); }, 2600);
  }

  function setAll(v) {
    var s = {};
    CATS.forEach(function (c) { if (!c.locked) s[c.id] = v; });
    save(s); showBar(false); closePrefsIfOpen(); flash();
  }
  function closePrefsIfOpen() { if (modal.getAttribute("data-open") === "true") closePrefs(); }

  function onClick(e) {
    var t = e.target.closest("[data-ck]"); if (!t) return;
    var act = t.getAttribute("data-ck");
    if (act === "all") return setAll(true);
    if (act === "none") return setAll(false);
    if (act === "prefs") return openPrefs();
    if (act === "close") return closePrefs();
    if (act === "save") {
      var s = {};
      modal.querySelectorAll("input[data-cat]").forEach(function (i) {
        if (!i.disabled) s[i.getAttribute("data-cat")] = i.checked;
      });
      save(s); showBar(false); closePrefs(); flash();
    }
  }

  /* A previous build of this site stored submitted leads in the visitor's own
     browser under pc-leads (name, phone, email in clear text) and a banner flag
     under pc-cookie-ok. Neither key is used by any current code, but they are
     still sitting in the localStorage of everyone who used that build — their
     own personal details, left behind on their machine. Purge on sight. */
  function purgeLegacy() {
    ["pc-leads", "pc-cookie-ok"].forEach(function (k) {
      try { if (localStorage.getItem(k) !== null) localStorage.removeItem(k); } catch (e) {}
    });
  }

  function boot() {
    purgeLegacy();
    document.body.appendChild(bar);
    document.body.appendChild(modal);
    document.body.appendChild(toast);
    bar.addEventListener("click", onClick);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) return closePrefs();
      onClick(e);
    });
    modal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); closePrefs(); } else trap(e, modal);
    });

    /* a permanent way back in — required so consent can be withdrawn */
    document.querySelectorAll("[data-ck-open]").forEach(function (n) {
      n.addEventListener("click", function (ev) { ev.preventDefault(); openPrefs(); });
    });

    if (!current) showBar(true);

    /* the bar grows a line when the text rewraps, so the clearance must follow */
    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t); t = setTimeout(syncBarHeight, 120);
    });
  }

  /* the gate every future non-essential script must pass through */
  window.pcConsent = {
    allows: function (cat) { return !!allowed()[cat]; },
    all: allowed,
    open: openPrefs,
    onChange: function (fn) { if (typeof fn === "function") listeners.push(fn); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} current = null; showBar(true); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
