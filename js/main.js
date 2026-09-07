// js/main.js — theme toggle, language toggle, nav state, back-to-top,
// shared helpers. Loaded on every page (after data/i18n.js, via js/boot.js on
// the pages that also need JSON content).
(function () {
  "use strict";
  var d = document.documentElement;
  var SITE = (window.SITE = window.SITE || {});

  SITE.LANGS = ["en", "fr", "ko", "de"];
  SITE.lang = function () {
    return SITE.LANGS.indexOf(d.dataset.lang) !== -1 ? d.dataset.lang : "en";
  };
  SITE.t = function (key) {
    var dict = (SITE.i18n && SITE.i18n[SITE.lang()]) || {};
    var v = key.split(".").reduce(function (o, k) { return o && o[k]; }, dict);
    if (v == null && SITE.i18n) {
      v = key.split(".").reduce(function (o, k) { return o && o[k]; }, SITE.i18n.en);
    }
    return v;
  };
  // Render a string in every language; CSS shows the active one.
  // Missing translations fall back to English.
  SITE.dual = function (en, fr, ko, de) {
    return '<span lang="en">' + en + "</span>" +
      '<span lang="fr">' + (fr == null ? en : fr) + "</span>" +
      '<span lang="ko">' + (ko == null ? en : ko) + "</span>" +
      '<span lang="de">' + (de == null ? en : de) + "</span>";
  };
  SITE.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  // Content edited through /admin comes back with "" where the hand-written data
  // used null (Decap has no null). Treat both as "absent".
  SITE.num = function (v) {
    return v == null || v === "" ? null : Number(v);
  };
  SITE.filled = function (obj) {
    return !!obj && SITE.LANGS.some(function (l) { return obj[l]; });
  };

  SITE.reducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  // ---- File-existence pruning ----
  // Buttons that point at a local file (slides, poster PDFs, paper PDFs)
  // carry data-file="<path>"; if the file does not exist on the server the
  // button is removed. On file:// existence cannot be checked — buttons stay.
  var fileCheckCache = {};
  SITE.fileExists = function (path) {
    if (!/^https?:$/.test(location.protocol)) return Promise.resolve(true);
    if (!fileCheckCache[path]) {
      fileCheckCache[path] = fetch(path, { method: "HEAD" }).then(
        function (r) { return r.ok; },
        function () { return true; } // network failure: keep the button
      );
    }
    return fileCheckCache[path];
  };
  SITE.pruneMissing = function (scope) {
    (scope || document).querySelectorAll("[data-file]").forEach(function (el) {
      SITE.fileExists(el.getAttribute("data-file")).then(function (ok) {
        if (!ok) el.remove();
      });
    });
  };

  // ---- Live region (announces copy/filter feedback politely) ----
  var live = document.querySelector("[data-live-region]");
  var liveTimer = null;
  SITE.announce = function (msg) {
    if (!live) return;
    live.textContent = msg;
    live.classList.add("is-shown");
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () {
      live.classList.remove("is-shown");
    }, 2000);
  };

  // ---- aria-label patching (the few attribute strings JS must translate) ----
  function patchAria() {
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var s = SITE.t(el.getAttribute("data-i18n-aria-label"));
      if (s) el.setAttribute("aria-label", s);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var s = SITE.t(el.getAttribute("data-i18n-placeholder"));
      if (s) el.setAttribute("placeholder", s);
    });
  }

  // ---- Theme toggle ----
  var themeBtn = document.querySelector("[data-theme-btn]");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = d.dataset.theme === "dark" ? "light" : "dark";
      d.classList.add("theming");
      d.dataset.theme = next;
      themeBtn.setAttribute("aria-pressed", String(next === "dark"));
      try { localStorage.setItem("dj-theme", next); } catch (e) {}
      setTimeout(function () { d.classList.remove("theming"); }, 350);
    });
    themeBtn.setAttribute("aria-pressed", String(d.dataset.theme === "dark"));
  }

  // ---- Language toggle ----
  function setLang(lang, animate) {
    if (lang === SITE.lang()) return;
    var apply = function () {
      d.dataset.lang = lang;
      d.lang = lang;
      try { localStorage.setItem("dj-lang", lang); } catch (e) {}
      document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-lang-btn") === lang));
      });
      patchAria();
      document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
    };
    var main = document.querySelector("main");
    if (animate && main && !SITE.reducedMotion()) {
      main.style.transition = "opacity 150ms ease";
      main.style.opacity = "0";
      setTimeout(function () {
        apply();
        main.style.opacity = "1";
        setTimeout(function () { main.style.transition = ""; }, 200);
      }, 150);
    } else {
      apply();
    }
  }
  document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang-btn"), true); });
    b.setAttribute("aria-pressed", String(b.getAttribute("data-lang-btn") === SITE.lang()));
  });

  // ---- Nav: current page + scrolled state ----
  var page = (location.pathname.split("/").pop() || "index.html").replace(".html", "") || "index";
  var current = document.querySelector('.site-nav__link[data-nav="' + page + '"]');
  if (current) current.setAttribute("aria-current", "page");

  var nav = document.querySelector(".site-nav");
  function onScrollNav() {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  // ---- Back to top ----
  var backBtn = document.querySelector("[data-back-to-top]");
  if (backBtn) {
    var onScrollBack = function () {
      backBtn.classList.toggle("is-visible", window.scrollY > 2 * window.innerHeight);
    };
    window.addEventListener("scroll", onScrollBack, { passive: true });
    onScrollBack();
    backBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: SITE.reducedMotion() ? "auto" : "smooth" });
    });
  }

  // ---- Page-load choreography ----
  function onReady() {
    document.body.classList.add("is-loaded");
    patchAria();
    // SMIL animations (orbital satellite) cannot be stopped from CSS —
    // strip them when the user prefers reduced motion.
    if (SITE.reducedMotion()) {
      document.querySelectorAll("animateMotion, animate").forEach(function (a) { a.remove(); });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
