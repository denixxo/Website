// js/lectures.js — renders the teaching list on lectures.html.
// Data: window.SITE.lectures. Material buttons (slides / notebooks / handouts /
// tutorial) carry data-file and are pruned when the file does not exist.
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var list = document.querySelector("[data-lectures-list]");
  if (!list || !SITE.lectures) return;

  var dual = SITE.dual, esc = SITE.esc;
  function tFor(lang, k) {
    return k.split(".").reduce(function (o, x) { return o && o[x]; }, SITE.i18n[lang] || {});
  }
  var dualT = function (k) {
    var en = tFor("en", k);
    if (en == null) en = k.split(".").pop();
    return dual(en, tFor("fr", k), tFor("ko", k), tFor("de", k));
  };

  var TYPE_CHIP = {
    lecture: "chip--article",
    lab: "chip--proceedings",
    tutorial: "chip--topic",
    oral: "chip--preprint",
    coordination: "chip--award"
  };

  var MATERIALS = [
    { key: "slides", label: "slidesBtn", icon: "i-file" },
    { key: "notebooks", label: "notebooksBtn", icon: "i-code" },
    { key: "handouts", label: "handoutsBtn", icon: "i-pubs" },
    { key: "tutorial", label: "tutorialBtn", icon: "i-pencil" }
  ];

  function materialButtons(item) {
    return MATERIALS.map(function (m) {
      var path = item[m.key];
      if (!path) return "";
      return '<a class="btn btn--ghost" href="' + esc(path) + '" download data-file="' + esc(path) + '">' +
        '<svg class="icon" aria-hidden="true"><use href="#' + m.icon + '"/></svg>' + dualT(m.label) + "</a>";
    }).join("");
  }

  function descHTML(d) {
    if (!d) return "";
    return '<p class="talk-row__event">' +
      dual(esc(d.en || ""),
           d.fr == null ? null : esc(d.fr),
           d.ko == null ? null : esc(d.ko),
           d.de == null ? null : esc(d.de)) + "</p>";
  }

  var sorted = SITE.lectures.slice().sort(function (a, b) {
    return (b.year || 0) - (a.year || 0);
  });

  list.innerHTML = sorted.map(function (item) {
    var actions = materialButtons(item);
    return '<li class="talk-row" data-reveal>' +
      '<div class="talk-row__thumb talk-row__thumb--placeholder">' +
      '<svg class="icon" aria-hidden="true"><use href="#i-teaching"/></svg></div>' +
      '<div class="talk-row__body">' +
      '<p class="talk-row__title">' + esc(item.title) + "</p>" +
      '<p class="talk-row__event">' + esc(item.institution) + "</p>" +
      descHTML(item.desc) +
      '<div class="talk-row__meta">' +
      '<span class="date">' + esc(item.years || String(item.year || "")) + "</span>" +
      '<span class="chip ' + (TYPE_CHIP[item.type] || "chip--topic") + '">' + dualT("lectureType." + item.type) + "</span>" +
      (item.level ? '<span class="chip chip--topic">' + esc(item.level) + "</span>" : "") +
      (item.hours ? '<span class="chip chip--topic">' + item.hours + "&nbsp;h</span>" : "") +
      "</div>" +
      (actions ? '<div class="talk-row__actions">' + actions + "</div>" : "") +
      "</div></li>";
  }).join("");

  if (SITE.reveal) SITE.reveal(list);
  if (SITE.pruneMissing) SITE.pruneMissing(list);
})();
