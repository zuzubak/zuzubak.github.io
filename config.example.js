/* Copy to config.js for local development and paste in a CARTO basemap key.
 *
 * config.js is gitignored and written at deploy time from the CARTO_API_KEY repo secret
 * (see .github/workflows/deploy.yml). Without it the maps fall back to the keyless CARTO
 * endpoint, which now serves an "API KEY REQUIRED" watermark tile instead of a basemap.
 *
 * This key is not a credential in the usual sense -- the browser has to send it, so it is
 * public on every request the map makes. Restrict it by domain in the CARTO dashboard
 * rather than trying to keep the value hidden.
 */
window.CARTO_API_KEY = "";
