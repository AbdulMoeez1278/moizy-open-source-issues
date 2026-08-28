"use strict";

/**
 * Checks whether a cache entry has exceeded its TTL.
 *
 * @param {object} cache - Cache entry containing creation timestamp and TTL.
 * @param {number} cache.createdAt - Creation timestamp in milliseconds.
 * @param {number} cache.ttl - Time-to-live in milliseconds.
 * @returns {boolean} True if the cache entry is stale, otherwise false.
 *
 * @example
 * isCacheStale({
 *   createdAt: Date.now() - 5000,
 *   ttl: 3000
 * });
 * // true
 */

function isCacheStale({
    createdAt,
    ttl 
}) {

    if (typeof createdAt !== "number" || !Number.isFinite(createdAt)) {
        return true;
    }
    
    if (typeof ttl !== "number" || !Number.isFinite(ttl)) {
        return true;
    }

    if (ttl <= 0) {
        return true;
    }

    return Date.now() - createdAt >= ttl;
}

module.exports = isCacheStale;
