// js/card.js — the business card on the homepage, turning over with the scroll.
//
// The card (index.html, inside [data-card-stage]) is two faces on a 3D box.
// This script reads how far the card has travelled through the viewport —
// 0 when its top edge reaches the bottom of the screen, 1 when its bottom
// edge leaves the top — and sets, on the stage, the custom properties the CSS
// turns into the transform: --card-turn (the spin), --card-tilt (a slight
// lean), --card-glare (where the highlight sits on the face) and --card-shade
// (how wide the floor shadow is). The card makes TURNS full turns while
// crossing the screen and shows its front, the English side, when it sits in
// the middle — the Korean side instead while the site is in Korean.
//
// Nothing moves unless the page scrolls, so the angle is only ever computed
// once per frame. Without JS, or for visitors asking for reduced motion, the
// CSS defaults leave the card lying still, front up.
//
// A link to #card (the section's id) opens with the card centred in the
// viewport, which is exactly where it lies face on.
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var stage = document.querySelector("[data-card-stage]");
  var card = stage && stage.querySelector(".card3d");
  if (!card) return;

  // ---- #card: centre the card ----
  // A shared link to #card should open with the card in the middle of the
  // viewport, where it lies face on. The browser's own jump would put the
  // section's top edge under the nav, and it happens after this script runs —
  // so the fragment is taken out of the address before the browser acts on
  // it, the page is scrolled from here instead, and the fragment is put back
  // once the page has loaded. The centring is repeated when fonts and
  // pictures have settled the layout, unless the visitor has meanwhile
  // scrolled or pressed a key. A hash change on an open page glides there.
  var HASH = "#" + stage.id;
  function centre(glide) {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var top = window.scrollY + stage.getBoundingClientRect().top + card.offsetTop - (vh - card.offsetHeight) / 2;
    var smooth = glide && !(SITE.reducedMotion && SITE.reducedMotion());
    window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: smooth ? "smooth" : "auto" });
  }
  if (stage.id && location.hash === HASH) {
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

  // ---- The spin ----
  if (SITE.reducedMotion && SITE.reducedMotion()) return;

  var TURNS = 2; // full turns while the card crosses the viewport
  var TILT = 12; // total lean, in degrees, from the bottom of the screen to the top

  function frontOffset() {
    return SITE.lang && SITE.lang() === "ko" ? 180 : 0;
  }
  var offset = frontOffset();
  var queued = false;

  function update() {
    queued = false;
    // Not the card's own rect: that includes the 3D transform, whose projected
    // box shifts with the very angle being set. The stage holds no transform,
    // and offsetTop/offsetHeight are the card's untransformed layout slot.
    var top = stage.getBoundingClientRect().top + card.offsetTop;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var p = (vh - top) / (vh + card.offsetHeight);
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    var turn = (p - 0.5) * 360 * TURNS + offset;
    var rad = turn * Math.PI / 180;
    stage.style.setProperty("--card-turn", turn.toFixed(2) + "deg");
    stage.style.setProperty("--card-tilt", ((0.5 - p) * TILT).toFixed(2) + "deg");
    stage.style.setProperty("--card-glare", (50 + 60 * Math.sin(rad)).toFixed(1) + "%");
    stage.style.setProperty("--card-shade", Math.abs(Math.cos(rad)).toFixed(3));
  }

  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  // The card also moves when the page reflows without a scroll — web fonts
  // arriving, the hero text changing length with the language — so any change
  // in the page's size recomputes the angle too.
  window.addEventListener("load", schedule);
  if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(document.body);
  document.addEventListener("langchange", function () {
    offset = frontOffset();
    schedule();
  });
  update();
})();
