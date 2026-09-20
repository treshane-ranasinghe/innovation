/* BN Inventions — catalogue page: search, A–Z filtering, grouped rendering */
(function () {
  "use strict";

  var cfg = window.CATALOG;
  if (!cfg || !Array.isArray(cfg.items)) return;

  var grid = document.getElementById("results");
  var alpha = document.getElementById("alpha");
  var input = document.getElementById("search");
  var searchWrap = input ? input.closest(".search") : null;
  var clearBtn = document.getElementById("searchClear");
  var countEl = document.getElementById("count");

  var items = cfg.items.slice().sort(function (a, b) {
    return a.localeCompare(b, "en", { sensitivity: "base" });
  });

  var LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var state = { letter: null, query: "" };

  var initial = function (name) {
    var ch = name.trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(ch) ? ch : "#";
  };

  var available = {};
  items.forEach(function (i) {
    available[initial(i)] = true;
  });

  var esc = function (s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var highlight = function (name, q) {
    var safe = esc(name);
    if (!q) return safe;
    var at = name.toLowerCase().indexOf(q.toLowerCase());
    if (at < 0) return safe;
    return (
      esc(name.slice(0, at)) +
      "<mark>" +
      esc(name.slice(at, at + q.length)) +
      "</mark>" +
      esc(name.slice(at + q.length))
    );
  };

  /* ------------------------------------------------------------- A–Z chips */
  var buildAlpha = function () {
    if (!alpha) return;
    var html =
      '<button type="button" class="alpha__btn alpha__btn--all is-active" data-letter="">All</button>';
    LETTERS.forEach(function (l) {
      html +=
        '<button type="button" class="alpha__btn" data-letter="' +
        l +
        '"' +
        (available[l] ? "" : " disabled") +
        ">" +
        l +
        "</button>";
    });
    alpha.innerHTML = html;

    alpha.addEventListener("click", function (e) {
      var btn = e.target.closest(".alpha__btn");
      if (!btn || btn.disabled) return;
      var letter = btn.dataset.letter || null;
      // Clicking the active letter again clears the filter.
      state.letter = state.letter === letter ? null : letter;
      render();
    });
  };

  var syncAlpha = function () {
    if (!alpha) return;
    alpha.querySelectorAll(".alpha__btn").forEach(function (btn) {
      var l = btn.dataset.letter || null;
      btn.classList.toggle("is-active", l === state.letter);
      btn.setAttribute("aria-pressed", String(l === state.letter));
    });
  };

  /* --------------------------------------------------------------- Filters */
  var filtered = function () {
    var q = state.query.trim().toLowerCase();
    return items.filter(function (name) {
      if (state.letter && initial(name) !== state.letter) return false;
      if (q && name.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  };

  /* ---------------------------------------------------------------- Render */
  var mailto = function (name) {
    return (
      "mailto:" +
      (cfg.email || "sales@bernatali.com") +
      "?subject=" +
      encodeURIComponent("Enquiry: " + name) +
      "&body=" +
      encodeURIComponent(
        "Hello BN Inventions team,\n\nI would like more information on the following item:\n\n" +
          name +
          " (" +
          cfg.name +
          ")\n\nQuantity required:\nIntended application:\n\nThank you.\n"
      )
    );
  };

  var card = function (name) {
    return (
      '<article class="product">' +
      '<span class="product__dot" aria-hidden="true"></span>' +
      "<h3>" +
      highlight(name, state.query.trim()) +
      "</h3>" +
      '<a class="product__enquire" href="' +
      mailto(name) +
      '" aria-label="Enquire about ' +
      esc(name) +
      '">' +
      '<svg class="ico" aria-hidden="true"><use href="#i-mail"/></svg>' +
      "</a>" +
      "</article>"
    );
  };

  var render = function () {
    var list = filtered();

    if (countEl) {
      countEl.innerHTML = list.length
        ? "<b>" + list.length + "</b> of " + items.length + " products"
        : "No matches";
    }
    syncAlpha();

    if (!list.length) {
      grid.innerHTML =
        '<div class="empty">' +
        '<div class="icon-chip"><svg class="ico" aria-hidden="true"><use href="#i-search"/></svg></div>' +
        "<h3>Nothing matched that search</h3>" +
        "<p>We stock far more than this catalogue lists. Tell us what you need and we will source it.</p>" +
        '<div class="cta__actions"><button type="button" class="btn btn--ghost" id="resetFilters">Clear filters</button>' +
        '<a class="btn btn--primary" href="mailto:' +
        (cfg.email || "sales@bernatali.com") +
        '">Ask our team<svg class="ico" aria-hidden="true"><use href="#i-arrow-right"/></svg></a></div>' +
        "</div>";
      var reset = document.getElementById("resetFilters");
      if (reset) reset.addEventListener("click", clearAll);
      return;
    }

    // Searching or already filtered to one letter: a flat list is clearest.
    // Browsing the full A-Z: keep letter marks as signposts in the column flow.
    var showLetters = !state.query.trim() && !state.letter;
    var seen = null;
    var html = list
      .map(function (name) {
        var out = "";
        if (showLetters && initial(name) !== seen) {
          seen = initial(name);
          out += '<h2 class="letter-mark">' + seen + "</h2>";
        }
        return out + card(name);
      })
      .join("");

    grid.innerHTML = '<div class="index-flow">' + html + "</div>";
  };

  var clearAll = function () {
    state.letter = null;
    state.query = "";
    if (input) input.value = "";
    if (searchWrap) searchWrap.classList.remove("has-value");
    render();
    if (input) input.focus();
  };

  /* ---------------------------------------------------------------- Search */
  if (input) {
    var timer;
    input.addEventListener("input", function () {
      if (searchWrap) searchWrap.classList.toggle("has-value", input.value.length > 0);
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.query = input.value;
        render();
      }, 120);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") clearAll();
    });

    // "/" focuses search from anywhere on the page.
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      input.focus();
      input.select();
    });
  }

  if (clearBtn) clearBtn.addEventListener("click", clearAll);

  buildAlpha();
  render();
})();
