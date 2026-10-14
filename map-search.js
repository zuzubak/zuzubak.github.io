/* Shared address search for the maps on malcolmkennedy.com.

   Same arrangement as header.js: this file lives in the site repo, every project
   page sits on the same origin, so `<script src="/map-search.js">` reaches it from
   anywhere and there is one copy to fix.

   It is deliberately map-agnostic. The maps here are two Leaflet and one MapLibre,
   so this widget does the searching and hands back a plain result; each page
   decides how to move its own map.

       MapSearch.mount({
         container: "#search",          // element or selector
         placeholder: "Search an address",
         onSelect: function (r) { ... } // {lat, lon, label, bbox|null}
       });

   Geocoding is Photon (komoot), which is built for type-ahead and needs no key,
   falling back to Nominatim when Photon is unreachable. Both are volunteer-run:
   requests are debounced, capped at six results, biased to Toronto, and only sent
   from three characters up. Attribution sits under the results, which both
   services ask for. */
(function () {
  "use strict";

  // Toronto, generously drawn: Steeles to the lake, Etobicoke Creek to the Rouge.
  var BBOX = { minLon: -79.68, minLat: 43.56, maxLon: -79.09, maxLat: 43.89 };
  var CENTRE = { lat: 43.7, lon: -79.4 };
  var MIN_CHARS = 3;
  var DEBOUNCE_MS = 250;
  var LIMIT = 6;

  var CSS = [
    ".ms-wrap{position:relative;font:inherit}",
    ".ms-input{width:100%;box-sizing:border-box;padding:7px 28px 7px 10px;",
    "  border:1px solid #c6c6c6;border-radius:4px;background:#fff;font-size:13px;",
    "  font-family:inherit;color:#111}",
    ".ms-input:focus{outline:2px solid #2a78d6;outline-offset:-1px;border-color:#2a78d6}",
    ".ms-clear{position:absolute;top:50%;right:6px;transform:translateY(-50%);border:0;",
    "  background:none;cursor:pointer;font-size:15px;line-height:1;color:#777;padding:2px 4px}",
    ".ms-clear:hover{color:#111}",
    ".ms-list{position:absolute;z-index:1200;left:0;right:0;top:calc(100% + 3px);margin:0;",
    "  padding:0;list-style:none;background:#fff;border:1px solid #c6c6c6;border-radius:4px;",
    "  box-shadow:0 4px 14px rgba(0,0,0,.16);max-height:260px;overflow:auto}",
    ".ms-list[hidden]{display:none}",
    ".ms-item{padding:7px 10px;font-size:13px;cursor:pointer;border-bottom:1px solid #f0f0f0}",
    ".ms-item:last-child{border-bottom:0}",
    ".ms-item.ms-on,.ms-item:hover{background:#eaf2fd}",
    ".ms-item b{font-weight:600}",
    ".ms-item span{display:block;color:#666;font-size:11px;margin-top:1px}",
    ".ms-note{padding:7px 10px;font-size:12px;color:#666}",
    ".ms-credit{padding:5px 10px;font-size:10px;color:#888;border-top:1px solid #f0f0f0;",
    "  background:#fafafa}",
    ".ms-credit a{color:#888}"
  ].join("");

  function injectCss() {
    if (document.getElementById("ms-css")) return;
    var s = document.createElement("style");
    s.id = "ms-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // ---------------------------------------------------------------- geocoders

  function photon(q, signal) {
    var url = "https://photon.komoot.io/api/?q=" + encodeURIComponent(q) +
      "&limit=" + LIMIT + "&lat=" + CENTRE.lat + "&lon=" + CENTRE.lon +
      "&bbox=" + BBOX.minLon + "," + BBOX.minLat + "," + BBOX.maxLon + "," + BBOX.maxLat;
    return fetch(url, { signal: signal }).then(function (r) {
      if (!r.ok) throw new Error("photon " + r.status);
      return r.json();
    }).then(function (j) {
      return (j.features || []).map(function (f) {
        var p = f.properties || {};
        var street = [p.housenumber, p.street || p.name].filter(Boolean).join(" ");
        var where = [p.district || p.city, p.postcode].filter(Boolean).join(", ");
        return {
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          label: street || p.name || "",
          detail: where,
          bbox: p.extent
            ? [[p.extent[1], p.extent[0]], [p.extent[3], p.extent[2]]]  // S,W / N,E
            : null
        };
      }).filter(function (r) { return r.label; });
    });
  }

  function nominatim(q, signal) {
    var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=" + LIMIT +
      "&bounded=1&viewbox=" + BBOX.minLon + "," + BBOX.maxLat + "," +
      BBOX.maxLon + "," + BBOX.minLat + "&q=" + encodeURIComponent(q);
    return fetch(url, { signal: signal }).then(function (r) {
      if (!r.ok) throw new Error("nominatim " + r.status);
      return r.json();
    }).then(function (rows) {
      return rows.map(function (r) {
        var parts = String(r.display_name).split(", ");
        var b = r.boundingbox;
        return {
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
          label: parts.slice(0, 2).join(" "),
          detail: parts.slice(2, 4).join(", "),
          bbox: b ? [[parseFloat(b[0]), parseFloat(b[2])],
                     [parseFloat(b[1]), parseFloat(b[3])]] : null
        };
      });
    });
  }

  function geocode(q, signal) {
    return photon(q, signal).catch(function (e) {
      if (e && e.name === "AbortError") throw e;
      return nominatim(q, signal);
    });
  }

  // ---------------------------------------------------------------- widget

  function mount(opts) {
    injectCss();
    var host = typeof opts.container === "string"
      ? document.querySelector(opts.container) : opts.container;
    if (!host) return null;

    var wrap = document.createElement("div");
    wrap.className = "ms-wrap";
    wrap.innerHTML =
      '<input class="ms-input" type="search" autocomplete="off" spellcheck="false"' +
      (opts.inputId ? ' id="' + esc(opts.inputId) + '"' : "") +
      ' role="combobox" aria-expanded="false" aria-autocomplete="list"' +
      ' placeholder="' + esc(opts.placeholder || "Search an address") + '">' +
      '<button class="ms-clear" type="button" aria-label="Clear" hidden>&times;</button>' +
      '<ul class="ms-list" role="listbox" hidden></ul>';
    host.appendChild(wrap);

    var input = wrap.querySelector(".ms-input");
    var clear = wrap.querySelector(".ms-clear");
    var list = wrap.querySelector(".ms-list");
    var rows = [];
    var active = -1;
    var timer = null;
    var ctrl = null;

    function close() {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      active = -1;
    }

    function note(text) {
      list.innerHTML = '<li class="ms-note">' + esc(text) + "</li>";
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function render() {
      if (!rows.length) { note("No matches"); return; }
      list.innerHTML = rows.map(function (r, i) {
        return '<li class="ms-item" role="option" data-i="' + i + '">' +
          "<b>" + esc(r.label) + "</b>" +
          (r.detail ? "<span>" + esc(r.detail) + "</span>" : "") + "</li>";
      }).join("") +
        '<li class="ms-credit">Addresses from ' +
        '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">' +
        "OpenStreetMap</a></li>";
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function highlight(n) {
      var items = list.querySelectorAll(".ms-item");
      if (!items.length) return;
      if (active >= 0 && items[active]) items[active].classList.remove("ms-on");
      active = (n + items.length) % items.length;
      items[active].classList.add("ms-on");
      items[active].scrollIntoView({ block: "nearest" });
    }

    function choose(i) {
      var r = rows[i];
      if (!r) return;
      input.value = r.label + (r.detail ? ", " + r.detail : "");
      clear.hidden = false;
      close();
      if (opts.onSelect) opts.onSelect(r);
    }

    function run(q) {
      if (ctrl) ctrl.abort();
      ctrl = new AbortController();
      geocode(q, ctrl.signal).then(function (res) {
        rows = res;
        render();
      }).catch(function (e) {
        if (e && e.name === "AbortError") return;
        rows = [];
        note("Search is unavailable just now");
      });
    }

    input.addEventListener("input", function () {
      var q = input.value.trim();
      clear.hidden = !q;
      if (timer) clearTimeout(timer);
      if (q.length < MIN_CHARS) { rows = []; close(); return; }
      timer = setTimeout(function () { run(q); }, DEBOUNCE_MS);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); highlight(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlight(active - 1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (active >= 0) choose(active);
        // Only take the first result unprompted when it is the only one. Toronto has a
        // Spring Garden Avenue and a Spring Garden Road at opposite ends of the city, and
        // a search for one ranks the other second: picking silently would land the user
        // somewhere plausible and wrong. With several matches, highlight and let them choose.
        else if (rows.length === 1) choose(0);
        else if (rows.length) highlight(0);
        else if (input.value.trim().length >= MIN_CHARS) {
          if (timer) clearTimeout(timer);
          run(input.value.trim());
        }
      } else if (e.key === "Escape") { close(); input.blur(); }
    });

    list.addEventListener("mousedown", function (e) {
      var li = e.target.closest(".ms-item");
      if (li) { e.preventDefault(); choose(Number(li.dataset.i)); }
    });

    clear.addEventListener("click", function () {
      input.value = "";
      clear.hidden = true;
      rows = [];
      close();
      input.focus();
      if (opts.onClear) opts.onClear();
    });

    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) close();
    });

    return { input: input, element: wrap, close: close };
  }

  window.MapSearch = { mount: mount, geocode: geocode, BBOX: BBOX };
})();
