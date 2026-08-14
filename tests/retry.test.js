'use strict';

const retry = require('../utils/retry');
const { test, assertEquals, printSummary } = require('./test-utils.js');

// 1. Function succeeds on first attempt
test('succeeds on first attempt', async () => {
  const fn = async () => 'done';
  const result = await retry(fn);
  assertEquals(result, 'done');
});

// 2. Function succeeds after retries
test('succeeds after retries', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error("fail");
    }
    return "success";
  };

  const result = await retry(fn, { retries: 3, delay: 10, factor: 2 });
  assertEquals(result, "success");
});

// 3. Maximum retries reached
test('maximum retries reached', async () => {
  const fn = async () => {
    throw new Error("always fails");
  };

  let didThrow = false;

  try {
    await retry(fn, { retries: 2, delay: 10 });
  } catch (error) {
    didThrow = true;
  }

  assertEquals(didThrow, true);
});

// 4. Custom retry count
test('custom retry count', async () => {
  let callCount = 0;
  const fn = async () => {
    callCount++;
    throw new Error("always fails");
  };

  try {
    await retry(fn, { retries: 5, delay: 10 });
  } catch (error) {
    // expected
  }

  assertEquals(callCount, 6);
});

// 5. Custom delay
test('custom delay is respected', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 2) {
      throw new Error("fail");
    }
    return "ok";
  };

  const start = Date.now();
  await retry(fn, { retries: 3, delay: 100, factor: 1 }); // factor 1 = no growth, easy to check
  const elapsed = Date.now() - start;

  // 1 failure means exactly one wait of ~100ms happened.
  // Allow some slack (timers aren't perfectly precise).
  assertEquals(elapsed >= 90, true);
});

// 6. Exponential delay calculation
test('delay grows exponentially', async () => {
  const delays = [];
  let attempts = 0;
  let lastCallTime = Date.now();

  const fn = async () => {
    const now = Date.now();
    if (attempts > 0) {
      delays.push(now - lastCallTime);
    }
    lastCallTime = now;
    attempts++;
    if (attempts < 4) {
      throw new Error("fail");
    }
    return "ok";
  };

  await retry(fn, { retries: 3, delay: 50, factor: 2 });

  // Expect roughly 50ms, 100ms, 200ms between calls (with slack for timer imprecision)
  assertEquals(delays.length, 3);
  assertEquals(delays[0] >= 40 && delays[0] < 80, true);
  assertEquals(delays[1] >= 90 && delays[1] < 160, true);
  assertEquals(delays[2] >= 180 && delays[2] < 300, true);
});

// 7. Invalid options (e.g. negative retries shouldn't crash unexpectedly)
test('invalid options do not crash unexpectedly', async () => {
  const fn = async () => 'ok';
  // options as garbage — retry should still work using defaults or handle gracefully
  const result = await retry(fn, null);
  assertEquals(result, 'ok');
});

// 8. Non-function input
test('non-function input throws TypeError', async () => {
  let didThrow = false;
  let errorType = '';

  try {
    await retry(null);
  } catch (error) {
    didThrow = true;
    errorType = error.constructor.name;
  }

  assertEquals(didThrow, true);
  assertEquals(errorType, 'TypeError');
});

// 9. Error propagation after final retry
test('propagates the original error after final retry', async () => {
  const fn = async () => {
    throw new Error("specific failure message");
  };

  let caughtMessage = '';

  try {
    await retry(fn, { retries: 1, delay: 10 });
  } catch (error) {
    caughtMessage = error.message;
  }

  assertEquals(caughtMessage, "specific failure message");
});

printSummary();