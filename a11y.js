/* ============================================================================
   נגישות — accessibility widget. Shared by index.html / chatflow.html /
   podium.html.

   The binding standard is ת"י 5568 חלק 1 (ספטמבר 2023), required at level AA by
   תקנה 35א of the 2013 service regulations. Verified from the standard itself:
   it adopts WCAG **2.0**, not 2.1, plus seven Israeli national deviations — of
   which the one that bites here is 2.4.10 Section Headings, raised AAA -> AA,
   so a real heading hierarchy is legally mandatory in Israel. (3.1.2 Language
   of Parts is disapplied for Hebrew pages.) The regulation incorporates the
   standard "כתיקונם מזמן לזמן", so a future WCAG 2.1 edition binds automatically
   — which is why the pages also satisfy the 2.1 AA criteria that apply to them.

   Honest scope note, kept in the code on purpose: a widget CANNOT make an
   inaccessible site accessible. It offers the visitor display preferences and
   publishes the accessibility statement. The compliance work itself — landmarks,
   headings, contrast, keyboard operability, focus order, labels, motion
   criteria — lives in the pages themselves.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__a11yBooted) return;
  window.__a11yBooted = true;

  var KEY = "pc-a11y-v1";
  var DEFAULTS = { fs: 1, readable: false, lh: false, ls: false, contrast: false,
                   gray: false, links: false, cursor: false, nomotion: false, guide: false };
  var state = load();

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      var s = {};
      for (var k in DEFAULTS) s[k] = (k in raw) ? raw[k] : DEFAULTS[k];
      return s;
    } catch (e) { var d = {}; for (var j in DEFAULTS) d[j] = DEFAULTS[j]; return d; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---------------------------------------------------------------- apply */
  function apply() {
    var h = document.documentElement;
    h.style.setProperty("--a11y-fs", state.fs);
    h.classList.toggle("a11y-fs", state.fs !== 1);
    h.classList.toggle("a11y-readable", !!state.readable);
    h.classList.toggle("a11y-lh", !!state.lh);
    h.classList.toggle("a11y-ls", !!state.ls);
    h.classList.toggle("a11y-contrast", !!state.contrast);
    h.classList.toggle("a11y-gray", !!state.gray);
    h.classList.toggle("a11y-links", !!state.links);
    h.classList.toggle("a11y-cursor", !!state.cursor);
    h.classList.toggle("a11y-nomotion", !!state.nomotion);
    h.classList.toggle("a11y-guide-on", !!state.guide);

    /* Motion off must never cost the visitor content: the scroll reveals leave
       elements at opacity 0 until their tween runs, so stopping the engine
       without showing them would blank half the page. */
    if (state.nomotion) {
      if (window.gsap) {
        try {
          gsap.utils.toArray(".rv, .seqPanel, #oneStage .mod, #oneCore, #wires")
            .forEach(function (el) { gsap.set(el, { opacity: 1, y: 0, x: 0, scale: 1, clearProps: "transform" }); });
          gsap.globalTimeline.pause();
        } catch (e) {}
      }
      if (window.ScrollTrigger) { try { ScrollTrigger.refresh(); } catch (e) {} }
    } else if (window.gsap) {
      try { gsap.globalTimeline.play(); } catch (e) {}
    }
    syncControls();
  }

  /* ------------------------------------------------------------ the markup */
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="3.6" r="2.1"/><path d="M20.4 7.1c-.2-.6-.9-1-1.5-.8L14 7.9c-1.3.4-2.7.4-4 0L4.6 6.3c-.6-.2-1.3.2-1.5.8-.2.6.2 1.3.8 1.5l4.6 1.4v3.1l-2.2 6.6c-.2.7.1 1.4.8 1.6.7.2 1.4-.1 1.6-.8l2-6h.6l2 6c.2.7.9 1 1.6.8.7-.2 1-.9.8-1.6l-2.2-6.6V10l4.6-1.4c.6-.2 1-.9.8-1.5z"/></svg>';

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }

  var TOGGLES = [
    { id: "contrast", label: "ניגודיות גבוהה" },
    { id: "gray",     label: "גווני אפור" },
    { id: "links",    label: "הדגשת קישורים" },
    { id: "readable", label: "גופן קריא" },
    { id: "lh",       label: "ריווח שורות מוגדל" },
    { id: "ls",       label: "ריווח אותיות מוגדל" },
    { id: "nomotion", label: "עצירת אנימציות" },
    { id: "cursor",   label: "סמן עכבר גדול" },
    { id: "guide",    label: "מדריך קריאה" }
  ];

  var skip = el("a", { href: "#main", "class": "a11y-skip" }, "דלג לתוכן הראשי");
  var btn = el("button", {
    "class": "a11y-btn", type: "button", id: "a11yBtn",
    "aria-label": "פתיחת תפריט נגישות", "aria-expanded": "false", "aria-haspopup": "dialog",
    title: "תפריט נגישות (Alt+Shift+A)"
  }, ICON);
  var guide = el("div", { "class": "a11y-guide", "aria-hidden": "true" });

  var panel = el("div", {
    "class": "a11y-panel", id: "a11yPanel", role: "dialog", "aria-modal": "false",
    "aria-labelledby": "a11yTitle", "data-open": "false"
  });
  panel.innerHTML =
    '<div class="a11y-head">' +
      '<h2 id="a11yTitle">תפריט נגישות</h2>' +
      '<button class="a11y-x" type="button" data-close aria-label="סגירת תפריט הנגישות">✕</button>' +
    '</div>' +
    '<div class="a11y-body">' +
      '<div class="a11y-grp">' +
        '<h3>גודל טקסט</h3>' +
        '<div class="a11y-row"><div class="a11y-step">' +
          '<button type="button" data-fs="-1" aria-label="הקטנת גודל הטקסט">−</button>' +
          '<output id="a11yFsOut" aria-live="polite">100%</output>' +
          '<button type="button" data-fs="1" aria-label="הגדלת גודל הטקסט">+</button>' +
        '</div></div>' +
      '</div>' +
      '<div class="a11y-grp"><h3>תצוגה</h3><div id="a11yToggles"></div></div>' +
      '<div class="a11y-foot">' +
        '<button class="a11y-reset" type="button" data-reset>איפוס הגדרות נגישות</button>' +
        '<button class="a11y-link" type="button" data-statement>הצהרת נגישות</button>' +
        '<p class="a11y-note">ההגדרות נשמרות בדפדפן שלכם. אפשר לפתוח תפריט זה גם במקלדת: Alt+Shift+A. לניווט באתר במקלדת השתמשו ב-Tab, ולהפעלה ב-Enter או רווח.</p>' +
      '</div>' +
    '</div>';

  var modal = el("div", { "class": "a11y-modal", id: "a11yModal", role: "dialog",
    "aria-modal": "true", "aria-labelledby": "a11yDocTitle", "data-open": "false" });

  /* The statement is deliberately written so every claim in it is true today.
     Items the owner must supply are marked; they are the only blanks. */
  modal.innerHTML =
    '<div class="a11y-doc">' +
      '<div class="a11y-head">' +
        '<h2 id="a11yDocTitle">הצהרת נגישות</h2>' +
        '<button class="a11y-x" type="button" data-close-modal aria-label="סגירת הצהרת הנגישות">✕</button>' +
      '</div>' +
      '<div class="inner">' +
        '<p>אנו רואים חשיבות רבה במתן שירות שוויוני לכלל הגולשים, ופועלים להנגיש את האתר כך שיהיה זמין ונוח לשימוש גם עבור אנשים עם מוגבלות.</p>' +

        '<h3>רמת הנגישות באתר</h3>' +
        '<p>האתר הונגש בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, ולתקן הישראלי <b>ת"י 5568 חלק 1 — קווים מנחים לנגישות תכנים באינטרנט, ברמת הנגשה AA</b>.</p>' +
        '<p>בנוסף, ומעבר לנדרש, יושמו באתר גם דרישות מתוך המהדורה המתקדמת יותר של הקווים המנחים הבין-לאומיים (WCAG 2.1) ברמה AA — בין השאר בנוגע להתאמת התצוגה למסכים קטנים, לריווח טקסט ולהגבלת תנועה ואנימציה.</p>' +

        '<h3>התאמות הנגישות שבוצעו באתר</h3>' +
        '<ul>' +
          '<li>ניווט מלא באמצעות מקלדת: Tab למעבר בין רכיבים, Enter או רווח להפעלה, Esc לסגירת חלונות — עם סימון ברור ובולט של מוקד ההקלדה.</li>' +
          '<li>קישור "דלג לתוכן הראשי" בתחילת כל עמוד.</li>' +
          '<li>מבנה כותרות היררכי ותקין (h1–h6) ואזורי תוכן מסומנים (landmarks) לקוראי מסך.</li>' +
          '<li>טקסט חלופי לתמונות ולאיורים; רכיבים גרפיים דקורטיביים סומנו כך שלא יוקראו לשווא.</li>' +
          '<li>יחסי ניגודיות תואמי תקן בין הטקסט לרקע בכל תוכן האתר.</li>' +
          '<li>תוויות מקושרות לשדות הטופס והודעות שגיאה ברורות.</li>' +
          '<li>כיבוד העדפת מערכת ההפעלה להפחתת תנועה (prefers-reduced-motion), ואפשרות לעצור את כל האנימציות מתפריט הנגישות.</li>' +
          '<li>תפריט נגישות הנפתח בכל עמוד (גם בקיצור המקלדת Alt+Shift+A) הכולל: הגדלה והקטנה של הטקסט, ניגודיות גבוהה, גווני אפור, הדגשת קישורים, גופן קריא, ריווח שורות ואותיות, עצירת אנימציות, סמן עכבר גדול ומדריך קריאה. הבחירה נשמרת בדפדפן.</li>' +
        '</ul>' +

        '<h3>מגבלות נגישות ידועות</h3>' +
        '<p>באתר מוצגים איורים המדמים את מסכי המערכת. איורים אלה מסומנים כתמונה ומלווים בתיאור מילולי, ולכן הטקסט המופיע בתוכם — ובכלל זה יחסי הניגודיות שבו — אינו נגיש בפני עצמו. מדובר בתוכן להמחשה בלבד: כל המידע המהותי מופיע גם כטקסט רגיל בעמוד, ואינו נדרש לשם קבלת השירות או יצירת קשר.</p>' +
        '<p>ייתכן שבחלקים מסוימים באתר טרם הושלמה ההנגשה במלואה. אנו ממשיכים לבדוק ולשפר את נגישות האתר באופן שוטף.</p>' +

        '<h3>יצירת קשר בנושא נגישות</h3>' +
        '<p>נתקלתם בבעיית נגישות באתר, או שאתם זקוקים להתאמת נגישות שאינה קיימת? נשמח שתפנו אלינו — נטפל בפנייה בהקדם האפשרי.</p>' +
        '<ul>' +
          '<li>איש הקשר בנושא נגישות: <b data-fill>[יש להשלים שם]</b></li>' +
          '<li>טלפון: <b data-fill>[יש להשלים טלפון]</b></li>' +
          '<li>דוא"ל: <b data-fill>[יש להשלים כתובת דוא"ל]</b></li>' +
          '<li>וואטסאפ: <b data-fill>[יש להשלים מספר]</b></li>' +
        '</ul>' +
        '<p>ניתן לפנות אלינו גם בדוא"ל או בוואטסאפ ולא רק בטלפון, כדי לאפשר פנייה גם למי שהשיחה הטלפונית אינה נגישה עבורו.</p>' +

        '<h3>פרטי ההצהרה</h3>' +
        '<ul>' +
          '<li>שם העסק: <b>powercall — מבית יש לי זכות</b></li>' +
          '<li>כתובת האתר: <b>www.powercall.co.il</b></li>' +
          '<li>תאריך עדכון ההצהרה: <b data-fill>[יש להשלים תאריך]</b></li>' +
          '<li>ההנגשה והבדיקה בוצעו על ידי: <b data-fill>[יש להשלים]</b></li>' +
        '</ul>' +
      '</div>' +
    '</div>';


  /* ------------------------------------------------------------ behaviour */
  var lastFocus = null;

  function focusables(root) {
    return Array.prototype.filter.call(
      root.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'),
      function (n) { return n.offsetParent !== null || n === document.activeElement; });
  }
  function trap(e, root) {
    if (e.key !== "Tab") return;
    var f = focusables(root);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openPanel() {
    lastFocus = document.activeElement;
    panel.setAttribute("data-open", "true");
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "סגירת תפריט נגישות");
    var f = focusables(panel);
    if (f.length) f[0].focus();
  }
  function closePanel(restore) {
    panel.setAttribute("data-open", "false");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "פתיחת תפריט נגישות");
    if (restore !== false) btn.focus();
  }
  function panelOpen() { return panel.getAttribute("data-open") === "true"; }

  function openModal() {
    lastFocus = document.activeElement;
    modal.setAttribute("data-open", "true");
    var f = focusables(modal);
    if (f.length) f[0].focus();
  }
  function closeModal() {
    modal.setAttribute("data-open", "false");
    if (lastFocus && lastFocus.focus) lastFocus.focus(); else btn.focus();
  }
  function modalOpen() { return modal.getAttribute("data-open") === "true"; }

  function syncControls() {
    var out = panel.querySelector("#a11yFsOut");
    if (out) out.textContent = Math.round(state.fs * 100) + "%";
    TOGGLES.forEach(function (t) {
      var b = panel.querySelector('[data-toggle="' + t.id + '"]');
      if (b) b.setAttribute("aria-pressed", state[t.id] ? "true" : "false");
    });
  }

  function build() {
    var wrap = panel.querySelector("#a11yToggles");
    TOGGLES.forEach(function (t) {
      var b = el("button", { type: "button", "class": "a11y-opt",
        "data-toggle": t.id, "aria-pressed": "false" },
        '<span class="tick" aria-hidden="true"></span><span>' + t.label + '</span>');
      b.addEventListener("click", function () {
        state[t.id] = !state[t.id];
        save(); apply();
      });
      wrap.appendChild(b);
    });

    panel.addEventListener("click", function (e) {
      var fs = e.target.closest("[data-fs]");
      if (fs) {
        var step = parseInt(fs.getAttribute("data-fs"), 10) * 0.1;
        state.fs = Math.min(2, Math.max(0.9, Math.round((state.fs + step) * 10) / 10));
        save(); apply(); return;
      }
      if (e.target.closest("[data-close]")) { closePanel(); return; }
      if (e.target.closest("[data-reset]")) {
        for (var k in DEFAULTS) state[k] = DEFAULTS[k];
        save(); apply();
        if (window.gsap) { try { gsap.globalTimeline.play(); } catch (err) {} }
        return;
      }
      if (e.target.closest("[data-statement]")) { closePanel(false); openModal(); return; }
    });
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); closePanel(); }
      else trap(e, panel);
    });

    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.closest("[data-close-modal]")) closeModal();
    });
    modal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); closeModal(); }
      else trap(e, modal);
    });

    btn.addEventListener("click", function () { panelOpen() ? closePanel() : openPanel(); });

    document.addEventListener("keydown", function (e) {
      if (e.altKey && e.shiftKey && (e.key === "A" || e.key === "a" || e.code === "KeyA")) {
        e.preventDefault();
        panelOpen() ? closePanel() : openPanel();
      }
    });

    /* close the panel when the visitor clicks the page behind it */
    document.addEventListener("click", function (e) {
      if (!panelOpen()) return;
      if (panel.contains(e.target) || btn.contains(e.target)) return;
      closePanel(false);
    });

    document.addEventListener("mousemove", function (e) {
      if (!state.guide) return;
      guide.style.top = e.clientY + "px";
    });
  }

  function boot() {
    document.body.insertBefore(skip, document.body.firstChild);
    document.body.appendChild(guide);
    document.body.appendChild(btn);
    document.body.appendChild(panel);
    document.body.appendChild(modal);
    build();
    apply();

    /* a footer link, so the statement is reachable without the widget too */
    var foot = document.querySelector("footer .wrap") || document.querySelector("footer");
    if (foot) {
      var a = el("button", { type: "button", "class": "a11y-footlink" }, "הצהרת נגישות");
      a.style.cssText = "background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:3px;";
      a.addEventListener("click", openModal);
      foot.appendChild(a);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
