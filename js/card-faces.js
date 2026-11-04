// js/card-faces.js — the pictures on the two faces of the homepage card.
//
// They come from data/card.json (Business card in /admin). index.html keeps
// the original pictures in its markup, so the card still shows without JS and
// to crawlers; this script swaps in whatever the CMS names, if it differs.
// A field left empty keeps the picture from the markup, and a picture that
// fails to load is never swapped in, so the card never shows a broken face.
(function () {
  "use strict";
  var cfg = (window.SITE || {}).card || {};
  var stage = document.querySelector("[data-card-stage]");
  if (!stage) return;

  function clean(v) { return v == null ? "" : String(v).trim(); }

  [["front", ".card3d__face--front img"], ["back", ".card3d__face--back img"]].forEach(function (side) {
    var img = stage.querySelector(side[1]);
    if (!img) return;
    var src = clean(cfg[side[0]]);
    var alt = clean(cfg[side[0] + "_alt"]);
    if (alt) img.alt = alt;
    if (!src || src === img.getAttribute("src")) return;
    var next = new Image();
    next.onload = function () {
      img.width = next.naturalWidth;
      img.height = next.naturalHeight;
      img.src = src;
    };
    next.src = src;
  });
})();
