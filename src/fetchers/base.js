/**
 * Base class for content fetchers.
 *
 * Each content type (linkedin_embed, instagram_embed, etc.) should extend
 * this class and implement the fetch() method.
 *
 * V1: No fetchers are implemented — only the architecture is in place.
 * To add a new fetcher, create a file in src/fetchers/ that extends BaseFetcher,
 * then register it in src/fetchers/index.js.
 */
class BaseFetcher {
  /**
   * Fetch rich content for a tile.
   * @param {object} config — parsed content_config from the tile
   * @returns {string} — HTML snippet to store in cached_content
   */
  async fetch(config) {
    throw new Error('fetch() must be implemented by subclass');
  }

  /**
   * How long (in minutes) the cached content is valid.
   * Override in subclasses to customize.
   */
  get cacheDuration() {
    return 60; // default: 1 hour
  }
}

module.exports = BaseFetcher;
