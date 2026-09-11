// admin/preview.js — the panels shown beside each form in the CMS.
//
// Lists: every asset on this site is named after its entry's `id`, and nothing
// warns you when a path drifts from that rule: the site just silently drops the
// button. The "Files" panel spells out, per entry, the exact filename each
// upload needs and flags any stored path that does not match.
//
// CV: a reading copy of the page in one language at a time, flagging text that
// is missing in that language. Profile pictures: the homepage circle, running
// with the timing set in the form. Misc: the CV PDFs and the fixed-name assets.
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
    ".fg .dim{display:block;color:#5b5f6b;margin-top:2px}" +
    ".fg .empty{color:#5b5f6b;font-style:italic}" +
    // Profile pictures: the homepage circle.
    ".fg .pp{position:relative;width:160px;height:160px;border-radius:50%;overflow:hidden;" +
    "isolation:isolate;border:3px solid #d5d8de;background:#eceef1;margin:4px 0 18px;" +
    "display:grid;place-items:center}" +
    ".fg .pp img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
    ".fg .pp span{font-weight:700;font-size:44px;color:#1c1d21}" +
    // CV: a reading copy.
    ".cvp{padding:18px 20px 40px}" +
    ".cvp code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;" +
    "background:#eceef1;padding:1px 4px;border-radius:3px}" +
    ".cvp .tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}" +
    ".cvp .tabs button{font:inherit;font-size:12px;padding:3px 11px;border:1px solid #d5d8de;" +
    "border-radius:999px;background:#fff;color:#1c1d21;cursor:pointer}" +
    ".cvp .tabs button.on{background:#1c1d21;border-color:#1c1d21;color:#fff}" +
    ".cvp .tabs .n{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;" +
    "background:#b3520c;color:#fff;font-size:11px}" +
    ".cvp .rule{color:#5b5f6b;margin:0 0 16px}" +
    ".cvp .side{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px 20px;" +
    "border:1px solid #e2e4e9;border-radius:7px;background:#fff;padding:12px 14px}" +
    ".cvp h4{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5b5f6b;margin:0 0 4px}" +
    ".cvp ul{list-style:none;margin:0;padding:0}" +
    ".cvp .dots{color:#4a6fa5;letter-spacing:1px}" +
    ".cvp h3{font-size:14px;margin:22px 0 6px;display:flex;gap:10px;align-items:baseline}" +
    ".cvp h3 .count{color:#5b5f6b;font-weight:400}" +
    ".cvp h3 code{margin-left:auto;font-weight:400}" +
    ".cvp .e{display:grid;grid-template-columns:92px 1fr;gap:12px;padding:8px 0;border-top:1px solid #eceef1}" +
    ".cvp .y{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#5b5f6b}" +
    ".cvp .t{font-weight:600}" +
    ".cvp .s,.cvp .d{color:#5b5f6b;white-space:pre-line;margin-top:2px}" +
    ".cvp .chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}" +
    ".cvp .chip{font-size:11px;padding:1px 8px;border-radius:999px;background:#eceef1}" +
    ".cvp .chip.award{background:#fbeed9;color:#7a4300}" +
    ".cvp .chip.award:before{content:'\\2605  '}" +
    ".cvp .lnk{text-decoration:underline;color:#2f5aa8}" +
    ".cvp .fb{text-decoration:underline dotted #b3520c 2px;text-underline-offset:3px;cursor:help}",
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

  // ------------------------------------------------------------------ cv ---
  // A reading copy of the CV, one language at a time. A text translated into
  // some languages but not the one being read is underlined: the page falls
  // back to English there. A text with no translation at all is taken to be
  // language-neutral — a name, an acronym — and is never flagged.
  var CODES = LANGS.map(function (l) { return l.code; });

  function clean(v) {
    return v == null ? "" : String(v).trim();
  }

  // An { en, fr, ko, de } object, as opposed to an entry or a section.
  function isText(o) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return false;
    var keys = Object.keys(o);
    return keys.length > 0 && keys.every(function (k) { return CODES.indexOf(k) !== -1; });
  }

  // Empty in `lang` although some other language besides English has text.
  function missing(o, lang) {
    return !clean(o[lang]) && CODES.some(function (c) {
      return c !== lang && c !== "en" && clean(o[c]);
    });
  }

  function countMissing(node, lang) {
    if (isText(node)) return missing(node, lang) ? 1 : 0;
    if (!node || typeof node !== "object") return 0;
    return Object.keys(node).reduce(function (n, k) { return n + countMissing(node[k], lang); }, 0);
  }

  // [text](url) links, shown as underlined text — the preview is for reading.
  function proseNodes(s) {
    var out = [], re = /\[([^\]]+)\]\(([^)\s]+)\)/g, last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push(s.slice(last, m.index));
      out.push(h("span", { className: "lnk", title: m[2], key: m.index }, m[1]));
      last = re.lastIndex;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  }

  var CvPreview = createClass({
    getInitialState: function () {
      return { lang: "en" };
    },
    render: function () {
      var self = this;
      var lang = this.state.lang;
      var name = LANGS[CODES.indexOf(lang)].label;
      var data = this.props.entry.getIn(["data"]);
      var cv = data && data.toJS ? data.toJS() : {};

      // One text in the language being read, underlined if it falls back.
      function t(o, format) {
        if (o == null || typeof o !== "object") o = { en: o };
        var shown = clean(o[lang]) || clean(o.en) || clean(o.fr) || clean(o.de) || clean(o.ko);
        if (!shown) return null;
        var body = format ? format(shown) : shown;
        return missing(o, lang)
          ? h("span", { className: "fb", title: "Not in " + name + " yet" }, body)
          : body;
      }
      function block(title, items, key) {
        return items.length ? h("div", { key: key }, h("h4", null, title), h("ul", null, items)) : null;
      }

      var tabs = h("div", { className: "tabs" }, LANGS.map(function (l) {
        var n = countMissing(cv, l.code);
        return h("button", {
          key: l.code,
          type: "button",
          className: l.code === lang ? "on" : "",
          title: n ? n + " missing" : "",
          onClick: function () { self.setState({ lang: l.code }); }
        }, l.label, n ? h("span", { className: "n" }, n) : null);
      }));

      var side = h("div", { className: "side" },
        block("Contact", (cv.contact || []).map(clean).filter(Boolean).map(function (s, i) {
          return h("li", { key: i }, s);
        }), "contact"),
        block("Location", (cv.location || []).map(function (o, i) {
          var line = t(o);
          return line ? h("li", { key: i }, line) : null;
        }).filter(Boolean), "location"),
        block("Languages", (cv.languages || []).filter(Boolean).map(function (l, i) {
          var on = Math.max(0, Math.min(5, Math.round(Number(l.dots) || 0)));
          return h("li", { key: i }, t(l.name), " ",
            h("span", { className: "dots" }, "●●●●●".slice(0, on) + "○○○○○".slice(on)), " ", t(l.level));
        }), "languages"),
        (cv.skills || []).filter(Boolean).map(function (g, i) {
          var items = (g.items || []).map(clean).filter(Boolean);
          return block(t(g.title) || "Skills", items.length ? [h("li", { key: 0 }, items.join(" · "))] : [], "skills" + i);
        })
      );

      var sections = (cv.sections || []).filter(Boolean).map(function (s, i) {
        return h("div", { key: i },
          h("h3", null, t(s.title) || "(no heading)",
            clean(s.count) ? h("span", { className: "count" }, clean(s.count)) : null,
            clean(s.id) ? h("code", null, "#" + clean(s.id)) : null),
          (s.entries || []).filter(Boolean).map(function (e, j) {
            var sub = t(e.subtitle, proseNodes), desc = t(e.desc, proseNodes);
            var chips = (e.chips || []).filter(Boolean).map(function (c, k) {
              var label = t(c.label);
              return label ? h("span", { key: k, className: "chip" + (c.type === "award" ? " award" : "") }, label) : null;
            }).filter(Boolean);
            return h("div", { className: "e", key: j },
              h("div", { className: "y" }, clean(e.years)),
              h("div", null,
                h("div", { className: "t" }, t(e.title, proseNodes)),
                sub ? h("div", { className: "s" }, sub) : null,
                desc ? h("div", { className: "d" }, desc) : null,
                chips.length ? h("div", { className: "chips" }, chips) : null));
          }));
      });

      var n = countMissing(cv, lang);
      return h("div", { className: "cvp" },
        tabs,
        h("p", { className: "rule" },
          n ? n + (n === 1 ? " text has" : " texts have") + " other translations but none in " + name +
              " — underlined below; the page shows " + (lang === "en" ? "another language" : "the English") + " there. "
            : "Nothing is missing in " + name + ". ",
          "A text with no translation at all (a name, an acronym) reads the same in every language and is not flagged."),
        side,
        sections
      );
    }
  });

  CMS.registerPreviewTemplate("cv", CvPreview);

  // ------------------------------------------------------------ portraits ---
  // The homepage circle, running with the timing set in the form and by the
  // same rules as js/portrait.js: no picture shows the initials, one stands
  // still, two or more take turns, each fading in over the one before.
  function seconds(v, fallback, min) {
    var n = v === "" || v == null ? NaN : Number(v);
    return isFinite(n) ? Math.max(min, n) : fallback;
  }

  var PortraitsPreview = createClass({
    getInitialState: function () {
      return { at: 0, under: -1, sizes: {} };
    },
    componentDidMount: function () {
      this.live = true;
      this.wait();
    },
    componentWillUnmount: function () {
      this.live = false;
      clearTimeout(this.timer);
    },
    settings: function () {
      var data = this.props.entry.getIn(["data"]);
      var get = function (k) { return data && data.get ? data.get(k) : null; };
      var list = get("pictures");
      return {
        pics: (list && list.toJS ? list.toJS() : []).map(clean).filter(Boolean),
        stay: seconds(get("stay"), 6, 1),
        fade: seconds(get("fade"), 1.5, 0)
      };
    },
    // Stay, fade the next picture in over the current one, then — once it is
    // covered — let the old one go.
    wait: function () {
      var self = this;
      this.timer = setTimeout(function () {
        if (!self.live) return;
        var s = self.settings();
        if (s.pics.length < 2) return self.wait();
        self.setState(function (st) {
          return { at: (st.at + 1) % s.pics.length, under: st.at % s.pics.length };
        });
        self.timer = setTimeout(function () {
          if (!self.live) return;
          self.setState({ under: -1 });
          self.wait();
        }, s.fade * 1000);
      }, this.settings().stay * 1000);
    },
    // Through getAsset, so a picture uploaded but not yet saved shows too.
    // Returns null while the CMS is still fetching it.
    url: function (path) {
      var got = "", pending = "";
      try {
        var list = this.props.fields.find(function (f) { return f.get("name") === "pictures"; });
        got = String(this.props.getAsset(path, list && list.get("field")) || "");
        pending = String(this.props.getAsset("") || "");
      } catch (e) { /* fall back to the path itself */ }
      if (got && got === pending) return null;
      got = got || path;
      // A bare relative path would resolve against /admin/.
      return /^(blob:|data:|https?:|\/)/.test(got) ? got : "/" + got;
    },
    noteSize: function (path, img) {
      var w = img.naturalWidth, ht = img.naturalHeight;
      var known = this.state.sizes[path];
      if (!w || !ht || (known && known.w === w && known.h === ht)) return;
      this.setState(function (st) {
        var sizes = Object.assign({}, st.sizes);
        sizes[path] = { w: w, h: ht };
        return { sizes: sizes };
      });
    },
    render: function () {
      var self = this;
      var s = this.settings();
      var n = s.pics.length;
      var at = n ? this.state.at % n : 0;
      var under = this.state.under;

      var circle = h("div", { className: "pp" },
        n ? s.pics.map(function (p, i) {
          var src = self.url(p);
          if (!src) return null;
          var top = i === at, below = n > 1 && i === under && i !== at;
          return h("img", {
            key: i + ":" + p,
            src: src,
            alt: "",
            onLoad: function (ev) { self.noteSize(p, ev.target); },
            style: {
              opacity: top || below ? 1 : 0,
              zIndex: top ? 2 : below ? 1 : 0,
              transition: "opacity " + s.fade + "s ease-in-out"
            }
          });
        }) : h("span", null, "DJ"));

      var round = Math.round(n * (s.stay + s.fade) * 10) / 10;
      var rule = n === 0 ? "No picture: the homepage shows the DJ initials."
        : n === 1 ? "One picture: shown as it is, with no animation."
        : n + " pictures: each stays " + s.stay + " s, then the next fades in over " + s.fade +
          " s, so one round takes " + round + " s. Visitors whose system asks for reduced" +
          " motion see only the first picture.";

      return h("div", { className: "fg" },
        h("h2", null, "On the homepage"),
        h("p", { className: "rule" }, rule),
        circle,
        n ? h("div", { className: "entry" }, s.pics.map(function (p, i) {
          var size = self.state.sizes[p];
          var big = size && Math.max(size.w, size.h) > 1200;
          return h("div", { className: "slot " + (big ? "warn" : "ok"), key: i },
            h("span", { className: "mark" }, String(i + 1)),
            h("span", null,
              h("code", null, p),
              size ? h("span", { className: big ? "was" : "dim" },
                size.w + " × " + size.h + " px" +
                (big ? " — far more than the 240 px circle needs; about 600 × 600 loads much faster" : "")) : null));
        })) : null
      );
    }
  });

  CMS.registerPreviewTemplate("portraits", PortraitsPreview);
})();
