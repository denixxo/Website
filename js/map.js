// js/map.js — the journey map (#map), on the homepage and at the top of the CV.
//
// A link to #map opens with the map centred in the viewport, the same way
// js/card.js centres the business card on #card: the browser's own jump
// would put the figure's top edge under the nav, and it happens after this
// script runs, so the fragment is taken out of the address before the
// browser acts on it, the page is scrolled from here instead, and the
// fragment is put back once the page has loaded. The centring is repeated
// when fonts and pictures have settled the layout, unless the visitor has
// meanwhile scrolled or pressed a key, and while the page grows over the
// first seconds. A hash change on an open page glides there.
//
// On the CV the map sits in a collapsible pane: #map opens it first, and
// reopening it plays the animation again.
(function () {
  "use strict";
  var figure = document.getElementById("map");
  if (!figure) return;
  var pane = figure.closest("details");

  function reducedMotion() {
    var SITE = window.SITE || {};
    return SITE.reducedMotion ? SITE.reducedMotion()
      : !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  var HASH = "#map";
  function centre(glide) {
    if (pane) pane.open = true;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var top = window.scrollY + figure.getBoundingClientRect().top - (vh - figure.offsetHeight) / 2;
    var smooth = glide && !reducedMotion();
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
    // The CV fills in after its JSON arrives, often after "load": until then
    // the page can be too short to scroll the map to the middle.
    if ("ResizeObserver" in window) {
      var grow = new ResizeObserver(settle);
      grow.observe(document.body);
      setTimeout(function () { grow.disconnect(); }, 5000);
    }
    window.addEventListener("load", function () {
      settle();
      setTimeout(function () {
        settle();
        try { history.replaceState(history.state, "", location.pathname + location.search + HASH); } catch (e) {}
      }, 0);
    });
  }
  window.addEventListener("hashchange", function () { if (location.hash === HASH) centre(true); });

  // Before the first reveal js/reveal.js plays it as it scrolls into view;
  // after that, a reopened pane restarts the animation from the beginning.
  if (pane) pane.addEventListener("toggle", function () {
    if (!pane.open || !figure.classList.contains("is-in")) return;
    figure.classList.remove("is-in");
    void figure.offsetWidth;
    figure.classList.add("is-in");
  });
})();
