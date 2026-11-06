// js/map.js — a link to #map (the journey figure's id) opens with the map
// centred in the viewport, the same way js/card.js centres the business
// card on #card: the browser's own jump would put the figure's top edge
// under the nav, and it happens after this script runs, so the fragment is
// taken out of the address before the browser acts on it, the page is
// scrolled from here instead, and the fragment is put back once the page
// has loaded. The centring is repeated when fonts and pictures have settled
// the layout, unless the visitor has meanwhile scrolled or pressed a key. A
// hash change on an open page glides there.
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var figure = document.getElementById("map");
  if (!figure) return;

  var HASH = "#map";
  function centre(glide) {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var top = window.scrollY + figure.getBoundingClientRect().top - (vh - figure.offsetHeight) / 2;
    var smooth = glide && !(SITE.reducedMotion && SITE.reducedMotion());
    window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: smooth ? "smooth" : "auto" });
  }
  if (location.hash === HASH) {
    var touched = false;
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) {
      window.addEventListener(type, function () { touched = true; }, { passive: true, once: true });
    });
    try {
      history.scrollRestoration = "manual"; // a reload would otherwise put the old position back
      history.replaceState(history.state, "", location.pathname + location.search);
    } catch (e) {}
    centre(false);
    var settle = function () { if (!touched) centre(false); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
    window.addEventListener("load", function () {
      settle();
      setTimeout(function () {
        settle();
        try { history.replaceState(history.state, "", location.pathname + location.search + HASH); } catch (e) {}
      }, 0);
    });
  }
  window.addEventListener("hashchange", function () { if (location.hash === HASH) centre(true); });
})();
