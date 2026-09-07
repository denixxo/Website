// admin/preview.js — the "Files" panel shown beside each list in the CMS.
//
// Every asset on this site is named after its entry's `id`, and nothing warns
// you when a path drifts from that rule: the site just silently drops the
// button. This panel spells out, per entry, the exact filename each upload
// needs and flags any stored path that does not match.
//
// Registered against the *file* name of each file collection (Decap uses the
// file name, not the collection name) — in admin/config.yml the two are
// deliberately identical, e.g. collection "posters" holds file "posters".
(function () {
  var h = window.h || (window.React && window.React.createElement);
  var createClass = window.createClass;
  if (!window.CMS || !h || !createClass) return;

  // Where each collection's uploads live, and how their filenames are built
  // from the entry id. Keep in step with the media_folder settings in
  // admin/config.yml — these two describe the same convention.
  var SPECS = {
    publications: {
      noun: "paper",
      idRule: "year-venue-slug",
      idExample: "2024-npjqi-noisy-qudit",
      slots: [
        { field: "pdf", label: "PDF", dir: "assets/pdf/publications/", suffix: ".pdf" },
        { field: "thumbnail", label: "Thumbnail", dir: "assets/img/pubs/", suffix: ".webp" }
      ],
      // thesis.html links the same PDF, so it lives under assets/pdf/thesis/
      // rather than with the papers. Deliberate, not a mistake.
      exempt: function (entry, slot) {
        return entry.type === "thesis" && slot.field === "pdf"
          ? "shared with the thesis page"
          : null;
      }
    },
    presentations: {
      noun: "talk",
      idRule: "year-venue-slug",
      idExample: "2025-icmm-rising-star",
      slots: [
        { field: "pdf", label: "Slide deck", dir: "assets/pdf/presentations/", suffix: ".pdf" },
        { field: "thumbnail", label: "Thumbnail", dir: "assets/img/talks/", suffix: ".webp" }
      ]
    },
    posters: {
      noun: "poster",
      idRule: "year-poster-slug",
      idExample: "2023-poster-noisy-qudit",
      slots: [
        { field: "pdf", label: "PDF", dir: "assets/pdf/posters/", suffix: ".pdf" },
        { field: "thumbnail", label: "Thumbnail", dir: "assets/img/posters/", suffix: ".webp" }
      ]
    },
    lectures: {
      noun: "course",
      idRule: "institution-topic",
      idExample: "qns-open-quantum-systems",
      slots: [
        { field: "slides", label: "Slides", dir: "assets/lectures/", suffix: "-slides.pdf" },
        { field: "notebooks", label: "Notebooks", dir: "assets/lectures/", suffix: "-notebooks.zip" },
        { field: "handouts", label: "Handouts", dir: "assets/lectures/", suffix: "-handout.pdf" },
        { field: "tutorial", label: "Tutorial", dir: "assets/lectures/", suffix: "-tutorial.pdf" }
      ]
    }
  };

  CMS.registerPreviewStyle(
    'body{margin:0;font:13px/1.55 ui-sans-serif,system-ui,"Segoe UI",sans-serif;' +
    "color:#1c1d21;background:#fbfbfc}" +
    ".fg{padding:18px 20px 40px}" +
    ".fg h2{font-size:15px;margin:0 0 4px}" +
    ".fg .rule{color:#5b5f6b;margin:0 0 18px}" +
    ".fg code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;" +
    "background:#eceef1;padding:1px 4px;border-radius:3px;word-break:break-all}" +
    ".fg .entry{border:1px solid #e2e4e9;border-radius:7px;padding:11px 13px;margin-bottom:9px;background:#fff}" +
    ".fg .eid{font-weight:600;margin-bottom:2px}" +
    ".fg .etitle{color:#5b5f6b;margin-bottom:9px}" +
    ".fg .slot{display:flex;gap:8px;align-items:baseline;padding:3px 0}" +
    ".fg .mark{flex:0 0 14px;text-align:center;font-weight:700}" +
    ".fg .lbl{flex:0 0 84px;color:#5b5f6b}" +
    ".fg .ok .mark{color:#1a7f43}.fg .warn .mark{color:#b3520c}.fg .none .mark{color:#a8adb8}" +
    ".fg .none{color:#a8adb8}" +
    ".fg .exempt .mark{color:#4a6fa5}.fg .exempt .was{color:#4a6fa5}" +
    ".fg .was{display:block;color:#b3520c;margin-top:2px}" +
    ".fg .empty{color:#5b5f6b;font-style:italic}",
    { raw: true }
  );

  function slotRow(spec, slot, entry, i) {
    var id = (entry.id || "").trim();
    var stored = (entry[slot.field] || "").trim();
    var expected = id ? slot.dir + id + slot.suffix : null;

    var exemption = stored && spec.exempt ? spec.exempt(entry, slot) : null;

    var state, mark, body;
    if (!stored) {
      state = "none"; mark = "·";
      body = h("span", null, expected ? h("code", null, expected) : "set an id first");
    } else if (exemption) {
      state = "exempt"; mark = "*";
      body = h("span", null,
        h("code", null, stored),
        h("span", { className: "was" }, exemption)
      );
    } else if (expected && stored === expected) {
      state = "ok"; mark = "✓";
      body = h("code", null, stored);
    } else {
      state = "warn"; mark = "!";
      body = h("span", null,
        expected ? h("code", null, expected) : h("code", null, stored),
        expected ? h("span", { className: "was" }, "stored as " + stored) : null
      );
    }

    return h("div", { className: "slot " + state, key: slot.field + i },
      h("span", { className: "mark" }, mark),
      h("span", { className: "lbl" }, slot.label),
      body
    );
  }

  function makePreview(key) {
    var spec = SPECS[key];
    return function FilesPreview(props) {
      var entry = props.entry;
      var raw = entry && entry.getIn ? entry.getIn(["data", key]) : null;
      var rows = raw && raw.toJS ? raw.toJS() : Array.isArray(raw) ? raw : [];

      return h("div", { className: "fg" },
        h("h2", null, "Filenames"),
        h("p", { className: "rule" },
          "Every file is named after the entry id (", h("code", null, spec.idRule),
          ", e.g. ", h("code", null, spec.idExample), "). ",
          "✓ matches · ! differs from the rule · * deliberate exception · · not uploaded yet."
        ),
        rows.length === 0
          ? h("p", { className: "empty" }, "No entries yet.")
          : rows.map(function (entryData, i) {
              return h("div", { className: "entry", key: i },
                h("div", { className: "eid" }, entryData.id || "(no id yet)"),
                h("div", { className: "etitle" }, entryData.title || ""),
                spec.slots.map(function (slot) { return slotRow(spec, slot, entryData, i); })
              );
            })
      );
    };
  }

  Object.keys(SPECS).forEach(function (key) {
    CMS.registerPreviewTemplate(key, makePreview(key));
  });

  // ---------------------------------------------------------------- misc ---
  // These are referenced from hand-written HTML at a fixed path, so unlike the
  // collections above they cannot be recorded in JSON: the favicon and the
  // social card in particular are read by crawlers that never run our scripts.
  // Upload them through Media, but named exactly as listed here.
  var FIXED = [
    { path: "assets/img/portrait.jpg", what: "Portrait",
      note: "square, ~600×600; the homepage falls back to the DJ initials without it" },
    { path: "assets/img/og-card.png", what: "Social card",
      note: "1200×630; shown when a link to the site is shared" },
    { path: "favicon.svg", what: "Favicon",
      note: "repository root, not assets/" },
    { path: "assets/pdf/thesis/thesis-jankovic-2024.pdf", what: "Thesis PDF",
      note: "switches the thesis page from the KIT record to the local copy" }
  ];

  var LANGS = [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "ko", label: "한국어" },
    { code: "de", label: "Deutsch" }
  ];

  var MiscPreview = createClass({
    getInitialState: function () {
      return { present: {} };
    },
    componentDidMount: function () {
      var self = this;
      FIXED.forEach(function (f) {
        // The admin page is served from the same origin as the site, so a HEAD
        // is enough to say whether the file has actually been uploaded.
        fetch("/" + f.path, { method: "HEAD" })
          .then(function (r) { return r.ok; }, function () { return null; })
          .then(function (ok) {
            if (!self.isMounted_) return;
            // Functional form: these four resolve independently, and reading
            // this.state directly would let one overwrite another's result.
            self.setState(function (prev) {
              var next = Object.assign({}, prev.present);
              next[f.path] = ok;
              return { present: next };
            });
          });
      });
      this.isMounted_ = true;
    },
    componentWillUnmount: function () { this.isMounted_ = false; },
    render: function () {
      var data = this.props.entry.getIn(["data"]);
      var cv = data && data.get ? data.get("cv") : null;
      var get = function (k) { return (cv && cv.get ? cv.get(k) : "") || ""; };
      var english = get("en").trim();
      var present = this.state.present;

      return h("div", { className: "fg" },
        h("h2", null, "CV downloads"),
        h("p", { className: "rule" },
          english
            ? "English is set, so every language has something to download."
            : "No English CV yet — the download button stays hidden until there is one."
        ),
        h("div", { className: "entry" },
          LANGS.map(function (l) {
            var own = get(l.code).trim();
            var state, mark, body;
            if (own) {
              state = "ok"; mark = "✓"; body = h("code", null, own);
            } else if (english) {
              state = "exempt"; mark = "*";
              body = h("span", null, "falls back to the English PDF, labelled ",
                h("code", null, "(EN)"));
            } else {
              state = "none"; mark = "·"; body = h("span", null, "button hidden");
            }
            return h("div", { className: "slot " + state, key: l.code },
              h("span", { className: "mark" }, mark),
              h("span", { className: "lbl" }, l.label),
              body
            );
          })
        ),

        h("h2", { style: { marginTop: "22px" } }, "Fixed filenames"),
        h("p", { className: "rule" },
          "These are referenced straight from the HTML, so the name matters — ",
          "upload them under Media, named exactly as below. ",
          "The favicon and social card are read by crawlers that never run the ",
          "page scripts, which is why they cannot be chosen here."
        ),
        FIXED.map(function (f) {
          var ok = present[f.path];
          var state = ok === true ? "ok" : ok === false ? "none" : "exempt";
          var mark = ok === true ? "✓" : ok === false ? "·" : "?";
          return h("div", { className: "entry", key: f.path },
            h("div", { className: "slot " + state },
              h("span", { className: "mark" }, mark),
              h("span", { className: "lbl" }, f.what),
              h("span", null,
                h("code", null, f.path),
                h("span", { className: "was" },
                  ok === false ? "not uploaded yet — " + f.note : f.note)
              )
            )
          );
        })
      );
    }
  });

  CMS.registerPreviewTemplate("site", MiscPreview);
})();
