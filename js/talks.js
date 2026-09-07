// js/talks.js — renders the talks list and poster gallery on talks.html.
// Data: window.SITE.presentations, window.SITE.posters.
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var talksList = document.querySelector("[data-talks-list]");
  var posterGrid = document.querySelector("[data-poster-grid]");
  if (!talksList && !posterGrid) return;

  var dual = SITE.dual, esc = SITE.esc;
  function tFor(lang, k) {
    return k.split(".").reduce(function (o, x) { return o && o[x]; }, SITE.i18n[lang] || {});
  }
  var dualT = function (k) {
    var en = tFor("en", k);
    if (en == null) en = k.split(".").pop();
    return dual(en, tFor("fr", k), tFor("ko", k), tFor("de", k));
  };

  function sorted(list) {
    return list.slice().sort(function (a, b) {
      var ya = a.year == null ? -1 : a.year, yb = b.year == null ? -1 : b.year;
      if (yb !== ya) return yb - ya;
      var ma = a.month == null ? 0 : a.month, mb = b.month == null ? 0 : b.month;
      return mb - ma;
    });
  }

  function awardHTML(a) {
    return dual(esc(a.en),
      a.fr == null ? null : esc(a.fr),
      a.ko == null ? null : esc(a.ko),
      a.de == null ? null : esc(a.de));
  }

  function dateHTML(item) {
    if (item.year == null) return "";
    if (item.month == null) return String(item.year);
    var per = SITE.LANGS.map(function (lang) {
      var months = tFor(lang, "months") || tFor("en", "months");
      return '<span lang="' + lang + '">' + esc(months[item.month - 1] + " " + item.year) + "</span>";
    });
    return per.join("");
  }

  // ---- Talks ----
  if (talksList && SITE.presentations) {
    talksList.innerHTML = sorted(SITE.presentations).map(function (talk) {
      var thumb = talk.thumbnail
        ? '<img src="' + esc(talk.thumbnail) + '" alt="" loading="lazy" width="400" height="225" ' +
          'onerror="this.parentElement.classList.add(\'talk-row__thumb--placeholder\');this.remove()">'
        : "";
      var placeholder = '<svg class="icon" aria-hidden="true"><use href="#i-talks"/></svg>';
      var chips = ['<span class="chip chip--' + esc(talk.type) + '">' + dualT("talkType." + talk.type) + "</span>"];
      if (talk.award) {
        chips.push('<span class="chip chip--award"><svg class="icon" aria-hidden="true"><use href="#i-award"/></svg>' +
          awardHTML(talk.award) + "</span>");
      }
      var actions = [];
      if (talk.pdf) {
        actions.push('<a class="btn btn--ghost" href="' + esc(talk.pdf) + '" download data-file="' + esc(talk.pdf) + '">' +
          '<svg class="icon" aria-hidden="true"><use href="#i-file"/></svg>' + dualT("slidesBtn") + "</a>");
      }
      if (talk.video) {
        actions.push('<a class="btn btn--ghost" href="' + esc(talk.video) + '">' +
          '<svg class="icon" aria-hidden="true"><use href="#i-video"/></svg>' + dualT("videoBtn") + "</a>");
      }
      return '<li class="talk-row" data-reveal>' +
        '<div class="talk-row__thumb' + (talk.thumbnail ? "" : " talk-row__thumb--placeholder") + '">' +
        (talk.thumbnail ? thumb : placeholder) + "</div>" +
        '<div class="talk-row__body">' +
        '<p class="talk-row__title">' + esc(talk.title) + "</p>" +
        '<p class="talk-row__event">' + esc(talk.event) + (talk.location ? " · " + esc(talk.location) : "") + "</p>" +
        '<div class="talk-row__meta"><span class="date">' + dateHTML(talk) + "</span>" + chips.join("") + "</div>" +
        (actions.length ? '<div class="talk-row__actions">' + actions.join("") + "</div>" : "") +
        "</div></li>";
    }).join("");
  }

  // ---- Posters ----
  var dialog = document.querySelector("[data-lightbox]");
  if (posterGrid && SITE.posters) {
    posterGrid.innerHTML = sorted(SITE.posters).map(function (p, i) {
      var award = p.award
        ? '<span class="chip chip--award poster-card__award"><svg class="icon" aria-hidden="true"><use href="#i-award"/></svg>' +
          awardHTML(p.award) + "</span>"
        : "";
      var img = p.thumbnail
        ? '<img src="' + esc(p.thumbnail) + '" alt="" loading="lazy" ' +
          'onerror="this.insertAdjacentHTML(\'afterend\',\'<svg class=&quot;icon&quot;><use href=&quot;#i-posters&quot;/></svg>\');this.remove()">'
        : '<svg class="icon" aria-hidden="true"><use href="#i-posters"/></svg>';
      return '<li data-reveal>' +
        '<button class="card card--hover poster-card" type="button" data-poster-index="' + i + '">' +
        '<span class="poster-card__thumb">' + img + award + "</span>" +
        '<span class="poster-card__body">' +
        '<span class="poster-card__title">' + esc(p.title) + "</span>" +
        '<span class="poster-card__event">' + esc(p.event) + (p.year ? " · " + p.year : "") + "</span>" +
        "</span></button></li>";
    }).join("");

    if (dialog) {
      posterGrid.addEventListener("click", function (ev) {
        var btn = ev.target.closest && ev.target.closest("[data-poster-index]");
        if (!btn) return;
        var p = sorted(SITE.posters)[Number(btn.getAttribute("data-poster-index"))];
        if (!p) return;
        dialog.querySelector("[data-lightbox-img]").innerHTML = p.thumbnail
          ? '<img class="lightbox__img" src="' + esc(p.thumbnail) + '" alt="' + esc(p.title) + '">'
          : '<div class="pdf-fallback"><div class="pdf-fallback__cover"><svg class="icon" aria-hidden="true"><use href="#i-posters"/></svg></div>' +
            '<div class="pdf-fallback__body"><p>' + esc(p.title) + "</p></div></div>";
        dialog.querySelector("[data-lightbox-caption]").innerHTML =
          esc(p.title) + " — " + esc(p.event) + (p.year ? ", " + p.year : "");
        var dl = dialog.querySelector("[data-lightbox-download]");
        dl.hidden = true;
        if (p.pdf) {
          dl.href = p.pdf;
          SITE.fileExists(p.pdf).then(function (ok) { dl.hidden = !ok; });
        }
        dialog.showModal();
      });
      dialog.addEventListener("click", function (ev) {
        // Close on backdrop click
        var rect = dialog.getBoundingClientRect();
        var inBox = ev.clientX >= rect.left && ev.clientX <= rect.right &&
                    ev.clientY >= rect.top && ev.clientY <= rect.bottom;
        if (!inBox) dialog.close();
      });
      var closeBtn = dialog.querySelector("[data-lightbox-close]");
      if (closeBtn) closeBtn.addEventListener("click", function () { dialog.close(); });
    }
  }

  if (SITE.reveal) SITE.reveal(document);
  if (SITE.pruneMissing) SITE.pruneMissing(document);
})();
