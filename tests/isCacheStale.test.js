const {
  test,
  assertEquals,
  printSummary,
} = require("./test-utils.js");

const isCacheStale = require("../utils/isCacheStale.js");

const NOW = 1_000_000;

const originalDateNow = Date.now;

Date.now = () => NOW;

test("fresh cache entry returns false", () => {
  const cache = {
    createdAt: NOW - 1000,
    ttl: 3000,
  };

  assertEquals(isCacheStale(cache), false);
});

test("expired cache entry returns true", () => {
  const cache = {
    createdAt: NOW - 5000,
    ttl: 3000,
  };

  assertEquals(isCacheStale(cache), true);
});

test("TTL of zero returns true", () => {
  const cache = {
    createdAt: NOW,
    ttl: 0,
  };

  assertEquals(isCacheStale(cache), true);
});

test("negative TTL returns true", () => {
  const cache = {
    createdAt: NOW,
    ttl: -1000,
  };

  assertEquals(isCacheStale(cache), true);
});

test("future timestamp returns false while TTL remains positive", () => {
  const cache = {
    createdAt: NOW + 5000,
    ttl: 3000,
  };

  assertEquals(isCacheStale(cache), false);
});

test("invalid timestamp returns true", () => {
  const cache = {
    createdAt: NaN,
    ttl: 3000,
  };

  assertEquals(isCacheStale(cache), true);
});

test("non-finite timestamp returns true", () => {
  const cache = {
    createdAt: Infinity,
    ttl: 3000,
  };

  assertEquals(isCacheStale(cache), true);
});

test("age equal to TTL returns true", () => {
  const cache = {
    createdAt: NOW - 3000,
    ttl: 3000,
  };

  assertEquals(isCacheStale(cache), true);
});

test("does not mutate the cache entry", () => {
  const cache = {
    createdAt: NOW - 1000,
    ttl: 3000,
  };

  const original = { ...cache };

  isCacheStale(cache);

  assertEquals(cache.createdAt, original.createdAt);
  assertEquals(cache.ttl, original.ttl);
});

Date.now = originalDateNow;

printSummary();
