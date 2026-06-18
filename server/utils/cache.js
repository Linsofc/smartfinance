const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Gets a value from the cache if it exists and has not expired
 * @param {string} key
 * @returns {*} cached value or null
 */
export const getCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

/**
 * Sets a value in the cache with the current timestamp
 * @param {string} key
 * @param {*} value
 */
export const setCache = (key, value) => {
  cache.set(key, { value, timestamp: Date.now() });
};

/**
 * Invalidates all cache entries starting with a prefix
 * @param {string} prefix
 */
export const invalidateCache = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

/**
 * Clears the entire cache store
 */
export const clearCache = () => {
  cache.clear();
};
