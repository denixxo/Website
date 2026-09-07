// js/publications.js — renders the selected + full publication lists on the
// homepage, with expand animation, filters, search and BibTeX copy.
// Data: window.SITE.publications (data/publications.js).
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var pubs = SITE.publications || [];
  var selectedGrid = document.querySelector("[data-selected-grid]");
  if (!selectedGrid || !pubs.length) return;

  var dual = SITE.dual, esc = SITE.esc;
  var t = function (k) { return SITE.t(k); };
  function tFor(lang, k) {
    return k.split(".").reduce(function (o, x) { return o && o[x]; }, SITE.i18n[lang] || {});
  }
  var tEn = function (k) { return tFor("en", k); };
  var dualT = function (k) {
    var en = tFor("en", k);
    if (en == null) en = k.split(".").pop();
    return dual(en, tFor("fr", k), tFor("ko", k), tFor("de", k));
  };

  function dateCompare(a, b) {
    var ya = a.year == null ? -1 : a.year, yb = b.year == null ? -1 : b.year;
    if (yb !== ya) return yb - ya;
    var ma = a.month == null ? 0 : a.month, mb = b.month == null ? 0 : b.month;
    if (mb !== ma) return mb - ma;
    return a.title.localeCompare(b.title);
  }

  function sorted(list) {
    return list.slice().sort(dateCompare);
  }

  function normalize(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  // ---- Card rendering ----
  function titleHref(p) {
    if (p.doi) return "https://doi.org/" + p.doi;
    if (p.arxiv) return "https://arxiv.org/abs/" + p.arxiv;
    if (p.pdf) return p.pdf;
    return null;
  }

  function highlightMe(authors) {
    return esc(authors).replace(/D\. Janković/g, '<span class="me">D. Janković</span>');
  }

  // A thumbnail area only exists when a thumbnail is provided; if the file
  // turns out to be missing (not generated yet), the area is removed entirely.
  SITE.thumbFallback = function (img) {
    var thumb = img.closest(".thumb");
    if (thumb) thumb.remove();
  };

  function thumbHTML(p) {
    if (!p.thumbnail) return "";
    var href = titleHref(p);
    var inner = '<img src="' + esc(p.thumbnail) + '" alt="" loading="lazy" width="900" height="429" ' +
      'onerror="window.SITE.thumbFallback(this)">';
    return '<div class="thumb">' + (href ? '<a href="' + esc(href) + '" tabindex="-1" aria-hidden="true">' + inner + "</a>" : inner) + "</div>";
  }

  function actionsHTML(p) {
    var out = [];
    if (p.doi) {
      out.push('<a class="btn btn--ghost" href="https://doi.org/' + esc(p.doi) + '">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-external"/></svg>' + dualT("journalBtn") + "</a>");
    }
    if (p.arxiv) {
      out.push('<a class="btn btn--ghost" href="https://arxiv.org/abs/' + esc(p.arxiv) + '">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-arxiv"/></svg>arXiv</a>');
    }
    if (p.pdf) {
      out.push('<a class="btn btn--ghost" href="' + esc(p.pdf) + '" download data-file="' + esc(p.pdf) + '">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-download"/></svg>PDF</a>');
    }
    if (p.bibtex) {
      out.push('<button class="btn btn--ghost copy-btn" type="button" data-copy-id="' + esc(p.id) + '" ' +
        'aria-label="' + esc(t("copyBibtexFor") + " " + p.title) + '">' +
        '<svg class="icon icon-copy" aria-hidden="true"><use href="#i-copy"/></svg>' +
        '<svg class="icon icon-check" aria-hidden="true" style="display:none"><use href="#i-check"/></svg>' +
        "BibTeX</button>");
    }
    return out.join("");
  }

  function venueHTML(p) {
    if (p.journal) return esc(p.journal);
    if (p.arxiv) return "arXiv:" + esc(p.arxiv) + " · " + dualT("inReview");
    return dualT("type." + p.type);
  }

  function cardHTML(p, withThumb) {
    var href = titleHref(p);
    var topics = (p.topics || []).map(function (s) {
      return '<span class="chip chip--topic">' + dualT("topics." + s) + "</span>";
    }).join("");
    var notes = p.notes ? '<p class="pub-card__notes small muted">' +
      dual(esc(p.notes.en || ""),
           p.notes.fr == null ? null : esc(p.notes.fr),
           p.notes.ko == null ? null : esc(p.notes.ko),
           p.notes.de == null ? null : esc(p.notes.de)) + "</p>" : "";
    return '<li class="card card--hover pub-card" id="pub-' + esc(p.id) + '" data-reveal>' +
      (withThumb ? thumbHTML(p) : "") +
      '<div class="pub-card__body">' +
      '<div class="pub-card__meta"><span class="chip chip--' + esc(p.type) + '">' + dualT("type." + p.type) + "</span>" +
      '<span class="year">' + (p.year != null ? p.year : "") + "</span></div>" +
      '<h3 class="pub-card__title">' + (href
        ? '<a href="' + esc(href) + '">' + esc(p.title) + "</a>"
        : esc(p.title)) + "</h3>" +
      '<p class="pub-card__authors">' + highlightMe(p.authors) + "</p>" +
      '<p class="pub-card__venue">' + venueHTML(p) + "</p>" +
      notes +
      (topics ? '<div class="pub-card__topics">' + topics + "</div>" : "") +
      '<div class="pub-card__actions">' + actionsHTML(p) + "</div>" +
      "</div></li>";
  }

  // ---- Selected list ----
  var selected = sorted(pubs.filter(function (p) { return p.selected; }));
  selectedGrid.innerHTML = selected.map(function (p) { return cardHTML(p, true); }).join("");
  if (SITE.pruneMissing) SITE.pruneMissing(selectedGrid);

  // ---- Expandable full list ----
  var region = document.querySelector(".pubs-all");
  var inner = region && region.querySelector(".pubs-all-inner");
  var toggle = document.querySelector("[data-pubs-toggle]");
  var rendered = false;
  var all = sorted(pubs);

  function labelToggle(open) {
    if (!toggle) return;
    var m = pubs.length;
    toggle.innerHTML = SITE.LANGS.map(function (lang) {
      var s = tFor(lang, open ? "showSelected" : "viewAll") || tFor("en", open ? "showSelected" : "viewAll");
      return '<span lang="' + lang + '">' + esc(s.replace("{m}", m)) + "</span>";
    }).join("") + '<svg class="icon icon--chevron" aria-hidden="true"><use href="#i-chevron-down"/></svg>';
    toggle.setAttribute("aria-expanded", String(open));
  }

  function facetValues(key) {
    var seen = [];
    all.forEach(function (p) {
      var vals = key === "topics" ? (p.topics || []) : [p[key]];
      vals.forEach(function (v) {
        if (v != null && seen.indexOf(v) === -1) seen.push(v);
      });
    });
    return seen;
  }

  function filterBarHTML() {
    var years = facetValues("year").sort(function (a, b) { return b - a; });
    var types = facetValues("type");
    var topics = facetValues("topics");
    function chips(facet, vals, label) {
      return '<fieldset><legend>' + dualT(label) + "</legend>" + vals.map(function (v) {
        var text = facet === "type" ? dualT("type." + v)
          : facet === "topics" ? dualT("topics." + v)
          : esc(v);
        return '<button class="chip chip--filter" type="button" aria-pressed="false" data-facet="' +
          facet + '" data-value="' + esc(v) + '">' + text + "</button>";
      }).join("") + "</fieldset>";
    }
    return '<div class="filter-bar" data-filter-bar>' +
      '<div class="filter-bar__search">' +
      '<svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>' +
      '<label class="visually-hidden" for="pub-search">' + dualT("searchLabel") + "</label>" +
      '<input type="search" id="pub-search" data-i18n-placeholder="searchPlaceholder" placeholder="' + esc(t("searchPlaceholder")) + '">' +
      "</div>" +
      chips("year", years, "filterYear") +
      chips("type", types, "filterType") +
      chips("topics", topics, "filterTopic") +
      '<div class="filter-bar__foot">' +
      '<span class="filter-bar__count" data-count aria-hidden="true"></span>' +
      '<button class="filter-bar__clear" type="button" data-clear hidden>' + dualT("clearFilters") + "</button>" +
      "</div></div>";
  }

  var state = { q: "", year: [], type: [], topics: [] };

  function matchesQuery(p) {
    if (!state.q) return true;
    var hay = normalize(p.title + " " + p.authors + " " + (p.journal || "") + " " + (p.arxiv || ""));
    return hay.indexOf(state.q) !== -1;
  }

  // The list of currently active filter chips (year, then type, then topics;
  // each in the order the chips were selected). Used to count how many a
  // publication satisfies.
  function activeKeys() {
    return state.year.map(function (v) { return { facet: "year", value: v }; })
      .concat(state.type.map(function (v) { return { facet: "type", value: v }; }))
      .concat(state.topics.map(function (v) { return { facet: "topics", value: v }; }));
  }

  function matchesKey(p, key) {
    if (key.facet === "year") return String(p.year) === key.value;
    if (key.facet === "type") return p.type === key.value;
    return (p.topics || []).indexOf(key.value) !== -1;
  }

  // hit = how many active filters this publication satisfies (out of total).
  function rankInfo(p, keys) {
    var hit = 0;
    keys.forEach(function (k) { if (matchesKey(p, k)) hit += 1; });
    return { hit: hit, total: keys.length };
  }

  function applyFilters() {
    var grid = inner.querySelector("[data-all-grid]");
    var keys = activeKeys();
    var searchShown = 0;
    var fullCount = 0;
    var run = function () {
      var rows = all.map(function (p) {
        var card = grid.querySelector('#pub-all-' + cssEscape(p.id));
        var info = rankInfo(p, keys);
        var searchOk = matchesQuery(p);
        if (card) {
          card.hidden = !searchOk; // filter chips never hide a publication — only the search box does
          card.classList.toggle("pub-card--full", searchOk && info.total > 0 && info.hit === info.total);
          card.classList.toggle("pub-card--partial", searchOk && info.total > 0 && info.hit > 0 && info.hit < info.total);
        }
        if (searchOk) {
          searchShown += 1;
          if (info.total > 0 && info.hit === info.total) fullCount += 1;
        }
        return { p: p, card: card, info: info };
      });

      // Reorder: most-matching first, least-matching last; publications
      // tied on match count are interleaved by date (newest first).
      rows.sort(function (a, b) {
        if (b.info.hit !== a.info.hit) return b.info.hit - a.info.hit;
        return dateCompare(a.p, b.p);
      });
      rows.forEach(function (r) { if (r.card) grid.appendChild(r.card); });

      var count = inner.querySelector("[data-count]");
      var tpl;
      if (state.q) {
        tpl = searchShown === 0 ? t("noResults")
          : t("resultsCount").replace("{n}", searchShown).replace("{m}", all.length);
      } else if (keys.length > 0) {
        tpl = t("matchCount").replace("{n}", fullCount).replace("{m}", all.length);
      } else {
        tpl = t("resultsCount").replace("{n}", all.length).replace("{m}", all.length);
      }
      if (count) count.textContent = tpl;
      SITE.announce(tpl);
      var active = state.q || state.year.length || state.type.length || state.topics.length;
      var clear = inner.querySelector("[data-clear]");
      if (clear) clear.hidden = !active;
    };
    // (document.startViewTransition is deliberately not used here: it stalls
    // in non-compositing tabs and delays filtering unpredictably.)
    if (SITE.reducedMotion()) { run(); return; }
    grid.classList.add("is-filtering");
    setTimeout(function () { run(); grid.classList.remove("is-filtering"); }, 100);
  }

  function cssEscape(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function renderAll() {
    inner.innerHTML = '<div>' + filterBarHTML() +
      '<ul class="pub-grid filter-dip" data-all-grid>' +
      all.map(function (p) {
        return cardHTML(p, false).replace('id="pub-' + p.id + '"', 'id="pub-all-' + p.id + '"');
      }).join("") + "</ul></div>";
    if (SITE.reveal) SITE.reveal(inner);
    if (SITE.pruneMissing) SITE.pruneMissing(inner);

    inner.querySelectorAll(".chip--filter").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var facet = chip.getAttribute("data-facet");
        var value = chip.getAttribute("data-value");
        var arr = state[facet];
        var i = arr.indexOf(value);
        if (i === -1) arr.push(value); else arr.splice(i, 1);
        chip.setAttribute("aria-pressed", String(i === -1));
        applyFilters();
      });
    });
    var search = inner.querySelector("#pub-search");
    var debounce = null;
    search.addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () {
        state.q = normalize(search.value.trim());
        applyFilters();
      }, 160);
    });
    inner.querySelector("[data-clear]").addEventListener("click", function () {
      state = { q: "", year: [], type: [], topics: [] };
      search.value = "";
      inner.querySelectorAll('.chip--filter[aria-pressed="true"]').forEach(function (c) {
        c.setAttribute("aria-pressed", "false");
      });
      applyFilters();
    });
    applyFilters();
  }

  // Deep-linking: publications.html?topics=qudits,esr-stm&type=article&year=2024&q=…
  // pre-activates the matching filter chips and scrolls to the filtered list.
  function applyUrlFilters() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return; }
    var any = false;
    ["topics", "type", "year"].forEach(function (facet) {
      var raw = params.get(facet);
      if (!raw) return;
      var wanted = raw.split(",");
      inner.querySelectorAll('.chip--filter[data-facet="' + facet + '"]').forEach(function (chip) {
        var v = chip.getAttribute("data-value");
        if (wanted.indexOf(v) !== -1 && state[facet].indexOf(v) === -1) {
          state[facet].push(v);
          chip.setAttribute("aria-pressed", "true");
          any = true;
        }
      });
    });
    var q = params.get("q");
    if (q) {
      var search = inner.querySelector("#pub-search");
      search.value = q;
      state.q = normalize(q);
      any = true;
    }
    if (!any) return;
    applyFilters();
    // Instant jump (like an anchor) — the page has just loaded. Note that
    // "auto" would defer to the page's scroll-behavior:smooth; "instant" won't.
    var bar = inner.querySelector("[data-filter-bar]");
    if (bar) bar.scrollIntoView({ behavior: "instant", block: "start" });
  }

  if (toggle && region && inner) {
    // Full list is expanded by default; the button collapses to selected-only.
    renderAll();
    rendered = true;
    region.classList.add("is-open");
    labelToggle(true);
    applyUrlFilters();
    toggle.addEventListener("click", function () {
      var open = !region.classList.contains("is-open");
      if (open && !rendered) { renderAll(); rendered = true; }
      region.classList.toggle("is-open", open);
      if (open) inner.removeAttribute("inert"); else inner.setAttribute("inert", "");
      labelToggle(open);
      if (!open) {
        var head = document.querySelector("#publications");
        if (head) head.scrollIntoView({ behavior: SITE.reducedMotion() ? "auto" : "smooth", block: "start" });
      }
    });
  }

  // ---- BibTeX copy (event delegation covers both lists) ----
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest && ev.target.closest(".copy-btn");
    if (!btn) return;
    var id = btn.getAttribute("data-copy-id");
    var p = pubs.filter(function (x) { return x.id === id; })[0];
    if (!p || !p.bibtex) return;
    var done = function (ok) {
      SITE.announce(t(ok ? "copied" : "copyFailed"));
      if (!ok) return;
      btn.classList.add("is-copied");
      btn.querySelector(".icon-copy").style.display = "none";
      btn.querySelector(".icon-check").style.display = "";
      setTimeout(function () {
        btn.classList.remove("is-copied");
        btn.querySelector(".icon-copy").style.display = "";
        btn.querySelector(".icon-check").style.display = "none";
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(p.bibtex).then(function () { done(true); },
        function () { done(fallbackCopy(p.bibtex)); });
    } else {
      done(fallbackCopy(p.bibtex));
    }
  });

  if (SITE.reveal) SITE.reveal(selectedGrid.parentElement || document);
})();
