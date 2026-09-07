// js/reveal.js — IntersectionObserver scroll reveal with stagger.
// Elements opt in with [data-reveal]; a [data-reveal-group] container staggers
// its [data-reveal] children (70ms steps, capped at 6). Reveals fire once.
(function () {
  "use strict";
  var SITE = window.SITE || {};

  function revealAll() {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  function stagger(scope) {
    (scope || document).querySelectorAll("[data-reveal-group]").forEach(function (group) {
      var i = 0;
      group.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.style.setProperty("--reveal-delay", Math.min(i, 6) * 70 + "ms");
        i += 1;
      });
    });
  }

  var io = null;
  function observe(scope) {
    if (!io) return;
    (scope || document).querySelectorAll("[data-reveal]:not(.is-in)").forEach(function (el) {
      io.observe(el);
    });
  }

  if (!("IntersectionObserver" in window) || (SITE.reducedMotion && SITE.reducedMotion())) {
    revealAll();
    // Still expose a refresh hook for late-rendered content.
    window.SITE = SITE;
    SITE.reveal = function () { revealAll(); };
    return;
  }

  io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  stagger();
  observe();

  // Re-scan after dynamic renders (publications, talks).
  SITE.reveal = function (scope) {
    stagger(scope);
    observe(scope);
  };
  window.SITE = SITE;
})();
