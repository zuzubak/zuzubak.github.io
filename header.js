/* Shared site header — the single source of truth for every page on
   malcolmkennedy.com, including project pages served from other repos.
   Those all sit on the same origin, so a root-relative <script src="/header.js">
   reaches this file from anywhere.

   Load it synchronously (no defer) as the first thing in <body> so the bar
   paints before the page's own app boots.

   It publishes its own height as --site-header-h on :root. Consuming pages use
   that to give the bar room, e.g. `height: calc(100vh - var(--site-header-h, 0px))`.
   The 0px fallback matters: if this file ever fails to load, pages fall back to
   full-height rather than breaking. */
(function () {
  var HEIGHT = 56;

  var SOCIALS = [
    ["https://github.com/zuzubak", "GitHub",
     "M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.7.82.58C20.56 22.29 24 17.8 24 12.5 24 5.87 18.63.5 12 .5z"],
    ["https://www.linkedin.com/in/malcolm-kennedy-817777118/", "LinkedIn",
     "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"],
    ["https://www.instagram.com/t.o.and.fro/", "Instagram",
     "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.35 2.68.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 002.12-1.38c.66-.66 1.08-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 00-1.38-2.12A5.88 5.88 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm6.41-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"]
  ];

  var CSS =
    '@font-face{font-family:"Toronto Subway";' +
      'src:url("/fonts/TorontoSubway-Bold.woff2") format("woff2"),' +
          'url("/fonts/TorontoSubway-Bold.woff") format("woff");' +
      'font-weight:700;font-style:normal;font-display:swap}' +
    /* Fixed black-on-white in both themes: a constant masthead, so it reads the
       same whether the page beneath it is light or dark. */
    '.site-header{box-sizing:border-box;height:var(--site-header-h);flex:0 0 auto;' +
      'position:sticky;top:0;z-index:2000;background:#fff;color:#111;' +
      'border-bottom:1px solid #e4e4e4;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}' +
    '.site-header-inner{box-sizing:border-box;max-width:1100px;margin:0 auto;height:100%;' +
      'padding:0 24px;display:flex;align-items:center;gap:18px}' +
    '.site-title{margin:0;font-family:"Toronto Subway",-apple-system,BlinkMacSystemFont,' +
      '"Segoe UI",Helvetica,Arial,sans-serif;font-size:clamp(17px,2.4vw,23px);font-weight:700;' +
      'letter-spacing:.12em;text-transform:uppercase;line-height:1.1;white-space:nowrap}' +
    '.site-title a{color:inherit;text-decoration:none}' +
    '.site-title a:hover{opacity:.7}' +
    '.site-social{display:flex;gap:16px;margin-left:auto}' +
    '.site-social a{color:#111;display:inline-flex;opacity:.7;transition:opacity 150ms ease}' +
    '.site-social a:hover{opacity:1}' +
    '.site-social a:focus-visible{outline:2px solid #111;outline-offset:3px;border-radius:2px}' +
    '.site-social svg{width:20px;height:20px;display:block;fill:currentColor}' +
    '@media (prefers-reduced-motion:reduce){.site-social a{transition:none}}';

  document.documentElement.style.setProperty("--site-header-h", HEIGHT + "px");

  var style = document.createElement("style");
  style.id = "site-header-styles";
  style.textContent = CSS;
  document.head.appendChild(style);

  var icons = SOCIALS.map(function (s) {
    return '<a href="' + s[0] + '" aria-label="' + s[1] + '" title="' + s[1] + '">' +
           '<svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="' + s[2] + '"/></svg></a>';
  }).join("");

  var header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML =
    '<div class="site-header-inner">' +
      '<p class="site-title"><a href="/">Malcolm Kennedy</a></p>' +
      '<nav class="site-social" aria-label="Social links">' + icons + "</nav>" +
    "</div>";

  // Script runs at the top of <body>, so document.body already exists.
  document.body.insertBefore(header, document.body.firstChild);
})();
