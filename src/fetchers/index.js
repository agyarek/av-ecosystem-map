/**
 * Content fetcher registry.
 *
 * Maps content_type values to their fetcher instances.
 * V1: All fetchers are null (placeholder). When implementing a fetcher,
 * require it here and assign an instance to the appropriate key.
 *
 * Example (V2):
 *   const LinkedInFetcher = require('./linkedin');
 *   fetchers['linkedin_embed'] = new LinkedInFetcher();
 */
const fetchers = {
  link: null,               // no fetcher needed — tile is just a link
  linkedin_embed: null,     // placeholder for V2
  instagram_embed: null,    // placeholder for V2
  github_activity: null,    // placeholder for V2
  rss_feed: null,           // placeholder for V2
  custom_html: null,        // placeholder for V2
};

function getFetcher(contentType) {
  return fetchers[contentType] || null;
}

/**
 * Background content refresh job.
 *
 * Finds all tiles with a non-link content_type whose cache has expired,
 * runs the appropriate fetcher, and stores the result.
 *
 * To activate, call this function on a cron schedule (e.g., every 15 minutes)
 * or trigger it manually from the admin UI via a "Refresh Content" button.
 *
 * @param {object} deps - { tileQueries, regenerateStaticPage }
 */
async function refreshContent({ tileQueries, regenerateStaticPage }) {
  const staleTiles = tileQueries.getStaleContent.all();

  if (staleTiles.length === 0) return;

  let updated = false;

  for (const tile of staleTiles) {
    const fetcher = getFetcher(tile.content_type);
    if (!fetcher) continue;

    try {
      const config = tile.content_config ? JSON.parse(tile.content_config) : {};
      const html = await fetcher.fetch(config);
      tileQueries.updateCachedContent.run(html, String(fetcher.cacheDuration), tile.id);
      updated = true;
      console.log(`Refreshed content for tile "${tile.title}" (${tile.content_type})`);
    } catch (err) {
      console.error(`Failed to refresh tile "${tile.title}":`, err.message);
    }
  }

  if (updated && regenerateStaticPage) {
    regenerateStaticPage();
  }
}

module.exports = { getFetcher, refreshContent, contentTypes: Object.keys(fetchers) };
