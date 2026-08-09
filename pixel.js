/* ============================================================================
   Meta Pixel — powercall.co.il

   THE ONE RULE (from consent.js, quoted so nobody has to go find it):
       if (window.pcConsent && window.pcConsent.allows('analytics')) { ...load... }
   This file gates on 'marketing', not 'analytics', because a Meta pixel is an
   advertising tracker: it is used for remarketing and for measuring ad
   campaigns, which is exactly what the 'marketing' category describes to the
   visitor. Gating it under 'analytics' would collect consent for one purpose
   and use it for another.

   Nothing here loads until the visitor has actively agreed. fbevents.js is not
   fetched, no cookie is written and no request reaches Meta before that — so a
   visitor who declines, or who never answers, is never sent to Facebook.

   If consent is later withdrawn we cannot un-load a script that is already in
   the page, so we stop sending events AND tell Meta to stop
   (fbq('consent','revoke')). The visitor's next page load starts clean.

   Privacy policy sections 2.5 / 4.3 / 9 describe this. If you change the
   behaviour here, change them the same day — a policy that describes a site
   that no longer exists is worse than no policy.
   ========================================================================== */
(function () {
  "use strict";

  var PIXEL_ID = "1539280671270585";
  var CATEGORY = "marketing";

  if (window.__pcPixelBooted) return;
  window.__pcPixelBooted = true;

  var loaded = false;
  var granted = false;

  function consented() {
    return !!(window.pcConsent && window.pcConsent.allows(CATEGORY));
  }

  /* The standard Meta base snippet, but the network fetch happens only when we
     call it — never at parse time. */
  function loadPixel() {
    if (loaded) return;
    loaded = true;

    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', PIXEL_ID);
    granted = true;
    window.fbq('track', 'PageView');
  }

  function grant() {
    if (!loaded) { loadPixel(); return; }
    if (!granted && window.fbq) {
      window.fbq('consent', 'grant');
      granted = true;
      window.fbq('track', 'PageView');
    }
  }

  function revoke() {
    if (loaded && granted && window.fbq) {
      window.fbq('consent', 'revoke');
    }
    granted = false;
  }

  /* A lead is the event that matters here — it is what the ad campaign
     optimises towards. Called from the form's success path only, so a failed
     send never reports a lead that did not happen. Safe to call when the
     visitor declined: it simply does nothing. */
  window.pcTrackLead = function () {
    if (!granted || !window.fbq) return;
    try { window.fbq('track', 'Lead'); } catch (e) {}
  };

  function sync() {
    if (consented()) grant();
    else revoke();
  }

  function boot() {
    if (!window.pcConsent) return;          // consent.js absent → track nothing
    sync();
    window.pcConsent.onChange(sync);
  }

  /* consent.js also boots on DOMContentLoaded; defer ours by a tick so
     window.pcConsent exists whichever order the two scripts finish in. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})();
