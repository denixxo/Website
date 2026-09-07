// js/cv.js — points the CV download button at the right language.
//
// English is the canonical CV: a language with no PDF of its own falls back to
// it, and the button says so, "Download PDF (EN)", rather than pretending the
// file is in the language being read. If not even the English PDF exists the
// button removes itself instead of linking at a 404.
//
// A CV can arrive two ways and both work: recorded in data/site.json through
// /admin (Misc → CV PDFs), or simply dropped on the server under the
// conventional name assets/pdf/cv/cv-denis-jankovic-<lang>.pdf.
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var btn = document.querySelector("[data-cv-download]");
  if (!btn) return;

  var FALLBACK = "en";
  var tag = btn.querySelector("[data-cv-lang]");
  var configured = (SITE.site && SITE.site.cv) || {};

  function conventionalPath(lang) {
    return "assets/pdf/cv/cv-denis-jankovic-" + lang + ".pdf";
  }

  // Resolves to the path of this language's CV, or null if there isn't one.
  function resolve(lang) {
    var recorded = (configured[lang] || "").trim();
    if (recorded) return Promise.resolve(recorded);
    var guess = conventionalPath(lang);
    return SITE.fileExists(guess).then(function (ok) { return ok ? guess : null; });
  }

  function update() {
    var lang = SITE.lang();
    resolve(lang)
      .then(function (own) {
        if (own) return { lang: lang, path: own };
        if (lang === FALLBACK) return null;
        return resolve(FALLBACK).then(function (english) {
          return english ? { lang: FALLBACK, path: english } : null;
        });
      })
      .then(function (choice) {
        btn.hidden = !choice;
        if (!choice) return;
        btn.href = choice.path;
        // Name the language only when it is not the one being read.
        if (tag) {
          tag.textContent = choice.lang === lang ? "" : " (" + choice.lang.toUpperCase() + ")";
        }
      });
  }

  update();
  document.addEventListener("langchange", update);
})();
