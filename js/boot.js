// js/boot.js — fetches JSON content into window.SITE, then runs the page scripts
// in order. Pages declare what they need on the script tag itself:
//
//   <script src="js/boot.js"
//           data-content="presentations,posters"
//           data-scripts="js/main.js,js/reveal.js,js/talks.js"></script>
//
// Content lives in data/<name>.json — each file holds { "<name>": [ ... ] } —
// and is edited through /admin (Decap CMS).
// Because the JSON is fetched rather than inlined, the pages that use it must be
// served over http(s) — see DEPLOY.md ("Local preview"). A dataset that fails to
// load becomes an empty list, so the page still renders its chrome.
(function () {
  var el = document.currentScript;
  var SITE = (window.SITE = window.SITE || {});

  function attrList(name) {
    return (el.getAttribute(name) || "")
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function loadContent(name) {
    return fetch("data/" + name + ".json")
      .then(function (res) {
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        return res.json();
      })
      // A list file wraps its array in a named key, because that is what a
      // Decap file collection maps onto: { "<name>": [ ... ] }. A file whose
      // fields are the content itself (data/site.json) is used as-is.
      .then(function (json) {
        SITE[name] = Array.isArray(json) ? json
          : json && Object.prototype.hasOwnProperty.call(json, name) ? json[name]
          : json || {};
      })
      .catch(function (err) {
        console.error("[boot] data/" + name + ".json failed to load — " + err.message);
        SITE[name] = [];
      });
  }

  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = s.onerror = resolve;
      document.body.appendChild(s);
    });
  }

  Promise.all(attrList("data-content").map(loadContent)).then(function () {
    return attrList("data-scripts").reduce(function (chain, src) {
      return chain.then(function () { return loadScript(src); });
    }, Promise.resolve());
  });
})();
