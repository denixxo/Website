// js/portrait.js — the round picture on the homepage.
//
// Pictures and timing come from data/portraits.json (Profile pictures in
// /admin). With no picture the DJ initials stay; a single picture is simply
// shown; two or more take turns — one is drawn at random to open with, then
// each stays `stay` seconds before the next fades in over `fade` seconds,
// carrying on down the list and wrapping around to the top. The incoming
// picture fades in on top of the outgoing one, which is hidden only once
// covered, so the circle never dims halfway through a fade.
//
// Only the first picture is fetched up front; each later one is fetched while
// the one before it is on screen. A picture that fails to load is skipped, and
// if none loads the initials stay. Visitors whose system asks for reduced
// motion get a single picture, standing still.
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var box = document.querySelector("[data-portrait]");
  var cfg = SITE.portraits || {};
  if (!box || !Array.isArray(cfg.pictures)) return;

  // The CMS writes "" for a cleared number; that means "use the default".
  function seconds(v, fallback, min) {
    var n = v === "" || v == null ? NaN : Number(v);
    return isFinite(n) ? Math.max(min, n) : fallback;
  }
  var stay = seconds(cfg.stay, 6, 1);
  var fade = seconds(cfg.fade, 1.5, 0);

  var queue = cfg.pictures
    .map(function (p) { return p == null ? "" : String(p).trim(); })
    .filter(Boolean)
    .map(function (src) { return { src: src }; });
  if (!queue.length) return;

  // Open on a picture drawn at random rather than always the first one, so a
  // visitor is not met by the same face every time. Rotating the list leaves
  // the running order untouched — only the starting point moves — so the turns
  // afterwards still read top to bottom and wrap around.
  if (queue.length > 1) {
    var start = Math.floor(Math.random() * queue.length);
    queue = queue.slice(start).concat(queue.slice(0, start));
  }

  var still = queue.length === 1 || (SITE.reducedMotion && SITE.reducedMotion());
  box.style.setProperty("--portrait-fade", fade + "s");

  // Resolves true once the picture has loaded, false if it fails. (Not
  // img.decode(): Chromium holds that promise until the tab is visible, which
  // would keep the initials up in a tab opened in the background.)
  function load(item) {
    if (!item.ready) {
      var img = (item.img = document.createElement("img"));
      img.alt = "";
      img.decoding = "async";
      item.ready = new Promise(function (resolve) {
        img.onload = function () { resolve(true); };
        img.onerror = function () { resolve(false); };
        img.src = item.src;
      });
    }
    return item.ready;
  }

  var current = null;
  var z = 0;

  function show(item) {
    var prev = current;
    var img = item.img;
    if (!prev) {
      // The first picture replaces the initials outright, without a fade.
      box.classList.remove("hero__portrait--initials");
      var initials = box.querySelector("span");
      if (initials) initials.remove();
    }
    if (!img.parentNode) box.appendChild(img);
    // Commit the transparent state first, or the browser skips the fade.
    if (prev) void img.offsetWidth;
    img.style.zIndex = ++z;
    img.classList.add("is-shown");
    current = item;
    if (prev) {
      setTimeout(function () { prev.img.classList.remove("is-shown"); }, fade * 1000);
    }
  }

  function after(item) {
    return queue[(queue.indexOf(item) + 1) % queue.length];
  }

  function step() {
    if (current && queue.length < 2) return; // nothing left to turn to
    var item = current ? after(current) : queue[0];
    load(item).then(function (ok) {
      if (!ok) {
        queue.splice(queue.indexOf(item), 1);
        return queue.length ? step() : undefined;
      }
      var faded = !!current;
      show(item);
      if (still || queue.length < 2) return;
      load(after(item));
      setTimeout(step, ((faded ? fade : 0) + stay) * 1000);
    });
  }

  step();
})();
