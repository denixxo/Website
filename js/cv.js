// js/cv.js — renders the CV page from data/cv.json, and points the download
// button at the right language.
//
// Content: window.SITE.cv, edited in /admin under CV. Every text is an
// { en, fr, ko, de } object. English is canonical: a language left empty (or
// null, or "" — the CMS writes "" for a cleared field) shows the English text,
// and a text with no translation at all is language-neutral — a name, an
// acronym — and is written once rather than in four identical spans.
//
// Download button: a language with no PDF of its own falls back to the English
// one, and the button says so, "Download PDF (EN)", rather than pretending the
// file is in the language being read. If not even the English PDF exists the
// button removes itself instead of linking at a 404.
//
// A CV PDF can arrive two ways and both work: recorded in data/site.json through
// /admin (Misc → CV PDFs), or simply dropped on the server under the
// conventional name assets/pdf/cv/cv-denis-jankovic-<lang>.pdf.
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var esc = SITE.esc;

  // ---- Content ----
  var CV = SITE.cv || {};
  var sidebar = document.querySelector("[data-cv-sidebar]");
  var main = document.querySelector("[data-cv-main]");

  function clean(v) {
    return v == null ? "" : String(v).trim();
  }

  function i18n(text, format) {
    if (text == null || typeof text !== "object") text = { en: text };
    format = format || esc;
    var fr = clean(text.fr), ko = clean(text.ko), de = clean(text.de);
    var base = clean(text.en) || fr || de || ko;
    if (!base) return "";
    if (!fr && !ko && !de) return format(base);
    return SITE.dual(format(base),
      fr ? format(fr) : null,
      ko ? format(ko) : null,
      de ? format(de) : null);
  }

  // Prose may link out with [text](url) and break lines. Relative links and
  // http(s) / mailto / tel only: anything else keeps its text and loses the link.
  function safeHref(href) {
    return /^(https?|mailto|tel):/i.test(href) ||
      (/^[\w#.\/?-]/.test(href) && !/^[a-z][a-z0-9+.-]*:/i.test(href));
  }
  function prose(s) {
    return esc(s)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, href) {
        return safeHref(href) ? '<a href="' + href + '">' + label + "</a>" : label;
      })
      .replace(/\n/g, "<br>");
  }

  function icon(name) {
    return '<svg class="icon" aria-hidden="true"><use href="#i-' + esc(clean(name) || "cv") + '"/></svg>';
  }

  // Email addresses become mailto: links, web addresses links, phone numbers
  // tel: links; anything else is shown as written.
  function contactItem(s) {
    s = clean(s);
    if (!s) return "";
    var href = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? "mailto:" + s
      : /^https?:\/\//i.test(s) ? s
      : /^\+?[\d\s().-]{6,}$/.test(s) ? "tel:" + s.replace(/[^\d+]/g, "")
      : null;
    return "<li>" + (href ? '<a href="' + esc(href) + '">' + esc(s) + "</a>" : esc(s)) + "</li>";
  }

  function locationItem(line) {
    var html = i18n(line);
    return html ? "<li>" + html + "</li>" : "";
  }

  function languageItem(l) {
    var name = i18n(l && l.name);
    if (!name) return "";
    var on = Math.max(0, Math.min(5, Math.round(SITE.num(l.dots) || 0)));
    var dots = "";
    for (var i = 0; i < 5; i++) dots += '<span class="dot' + (i < on ? " on" : "") + '"></span>';
    return '<li class="lang-meter"><span class="label">' + name + "</span>" +
      '<span class="dots">' + dots + "</span>" +
      '<span class="level">' + i18n(l.level) + "</span></li>";
  }

  function skillBlock(group) {
    var chips = ((group && group.items) || []).map(clean).filter(Boolean).map(function (s) {
      return '<span class="chip chip--topic">' + esc(s) + "</span>";
    }).join("");
    if (!chips) return "";
    return '<div class="cv-side-block"><h3>' + icon("skills") + i18n(group.title) + "</h3>" +
      '<div class="chip-cluster">' + chips + "</div></div>";
  }

  function chip(c) {
    var label = i18n(c && c.label);
    if (!label) return "";
    return c.type === "award"
      ? '<span class="chip chip--award">' + icon("award") + label + "</span>"
      : '<span class="chip chip--topic">' + label + "</span>";
  }

  function paragraph(cls, text) {
    var html = i18n(text, prose);
    return html ? '<p class="' + cls + '">' + html + "</p>" : "";
  }

  function entry(e) {
    e = e || {};
    var chips = (e.chips || []).map(chip).join("");
    var body = paragraph("tl-entry__role", e.subtitle) +
      paragraph("tl-entry__desc", e.desc) +
      (chips ? '<div class="tl-entry__chips">' + chips + "</div>" : "");
    return '<li class="tl-entry" data-reveal>' +
      '<div class="tl-entry__head"><span class="tl-entry__years">' + esc(clean(e.years)) + "</span>" +
      '<span class="tl-entry__org">' + i18n(e.title, prose) + "</span></div>" +
      (body ? '<div class="tl-entry__body">' + body + "</div>" : "") +
      "</li>";
  }

  function section(s) {
    s = s || {};
    var entries = (s.entries || []).map(entry).join("");
    var count = clean(s.count);
    return '<section class="cv-section"' + (clean(s.id) ? ' id="' + esc(clean(s.id)) + '"' : "") + ">" +
      '<div class="section-head" data-reveal>' + icon(s.icon) +
      "<h2>" + i18n(s.title) + "</h2>" +
      (count ? '<span class="count">' + esc(count) + "</span>" : "") +
      "</div>" +
      (entries ? '<ol class="timeline" data-reveal-group>' + entries + "</ol>" : "") +
      "</section>";
  }

  // The three fixed sidebar blocks keep their headings in cv.html and stay
  // hidden unless there is something to put under them.
  function fill(name, items, render) {
    var block = sidebar.querySelector('[data-cv-block="' + name + '"]');
    if (!block) return;
    var html = (items || []).map(render).join("");
    block.querySelector("ul").innerHTML = html;
    block.hidden = !html;
  }

  if (sidebar) {
    fill("contact", CV.contact, contactItem);
    fill("location", CV.location, locationItem);
    fill("languages", CV.languages, languageItem);
    sidebar.insertAdjacentHTML("beforeend", (CV.skills || []).map(skillBlock).join(""));
  }
  if (main) {
    main.innerHTML = (CV.sections || []).map(section).join("");
    if (SITE.reveal) SITE.reveal(main);
  }

  // ---- Download button ----
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
