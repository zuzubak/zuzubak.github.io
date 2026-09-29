/* Builds a CARTO basemap tile URL, keyed when config.js supplied one.
 *
 * The keyed endpoint lives under rastertiles/ and takes ?key=, and it does not use the
 * {s} subdomain placeholder. The keyless host stays as the fallback so a missing config.js
 * degrades to a watermarked map rather than no map at all.
 *
 * Styles are the usual CARTO names: light_all, dark_all, light_nolabels,
 * light_only_labels, and their dark counterparts.
 */
window.cartoTileUrl = function (style) {
  var key = (window.CARTO_API_KEY || "").trim();
  return key
    ? "https://basemaps.cartocdn.com/rastertiles/" + style + "/{z}/{x}/{y}{r}.png?key=" +
      encodeURIComponent(key)
    : "https://{s}.basemaps.cartocdn.com/" + style + "/{z}/{x}/{y}{r}.png";
};
