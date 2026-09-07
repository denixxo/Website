// js/thesis.js — click-to-load facade for the thesis PDF viewer.
// Uses the browser's native PDF viewer in an iframe; the embed control only
// appears when embedding can actually work (local file served over http(s),
// a browser with a PDF viewer, and a reasonably wide viewport). Download and
// open-in-tab links are always present in the static markup.
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var wrap = document.querySelector("[data-viewer]");
  var loadBtn = document.querySelector("[data-viewer-load]");
  var fsBtn = document.querySelector("[data-viewer-fullscreen]");
  if (!wrap || !loadBtn) return;

  var localPdf = wrap.getAttribute("data-pdf-local");
  var isHttp = /^https?:$/.test(location.protocol);
  var canEmbed = isHttp &&
    window.innerWidth >= 700 &&
    navigator.pdfViewerEnabled !== false;

  function enable(pdfUrl) {
    loadBtn.hidden = false;
    loadBtn.addEventListener("click", function () {
      loadBtn.hidden = true;
      wrap.hidden = false;
      var skeleton = wrap.querySelector("[data-viewer-skeleton]");
      var iframe = document.createElement("iframe");
      iframe.src = pdfUrl + "#view=FitH";
      iframe.title = loadBtn.getAttribute("data-viewer-title") || "PDF viewer";
      iframe.addEventListener("load", function () {
        iframe.classList.add("is-ready");
        if (skeleton) skeleton.remove();
        if (fsBtn) fsBtn.hidden = false;
      });
      wrap.appendChild(iframe);
      wrap.scrollIntoView({ behavior: SITE.reducedMotion && SITE.reducedMotion() ? "auto" : "smooth", block: "nearest" });
    });
  }

  if (canEmbed && localPdf) {
    // Only offer the embed if the local PDF actually exists on the server.
    fetch(localPdf, { method: "HEAD" }).then(function (res) {
      if (res.ok) {
        enable(localPdf);
        // Point the static Download / Open links at the local copy too.
        document.querySelectorAll("[data-thesis-link]").forEach(function (a) {
          a.href = localPdf;
        });
        var size = res.headers.get("content-length");
        var sizeEl = document.querySelector("[data-thesis-size]");
        if (size && sizeEl) {
          sizeEl.textContent = "PDF · " + (Number(size) / 1048576).toFixed(0) + " MB";
        }
      }
    }).catch(function () { /* keep remote links, no embed */ });
  }

  if (fsBtn) {
    fsBtn.addEventListener("click", function () {
      if (document.fullscreenElement) { document.exitFullscreen(); }
      else if (wrap.requestFullscreen) { wrap.requestFullscreen(); }
    });
  }
})();
