'use strict';

const preventDuplicateSubmit = require('../utils/preventDuplicateSubmit');

let passed = 0;
let failed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(`  ${err.message}`);
    failed++;
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
};

const assertEquals = (actual, expected, label = '') => {
  if (actual !== expected) {
    throw new Error(
      `${label ? label + ': ' : ''}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  await test('handles normal single submission', async () => {
    const fn = async (val) => {
      await delay(20);
      return `result: ${val}`;
    };

    const safeSubmit = preventDuplicateSubmit(fn);
    const result = await safeSubmit('test');
    assertEquals(result, 'result: test');
  });

  await test('returns the same pending promise for rapid repeated calls', async () => {
    const fn = async () => {
      await delay(50);
      return 'done';
    };

    const safeSubmit = preventDuplicateSubmit(fn);
    const p1 = safeSubmit();
    const p2 = safeSubmit();
    const p3 = safeSubmit();

    assert(p1 === p2, 'second call should return first promise');
    assert(p2 === p3, 'third call should return first promise');

    const results = await Promise.all([p1, p2, p3]);
    assertEquals(results[0], 'done');
    assertEquals(results[1], 'done');
    assertEquals(results[2], 'done');
  });

  await test('preserves all arguments and does not mutate them', async () => {
    let receivedArgs = null;
    const fn = async (a, b, c) => {
      receivedArgs = [a, b, c];
      await delay(20);
      return a + b + c;
    };

    const safeSubmit = preventDuplicateSubmit(fn);
    const originalObj = { key: 'value' };
    const originalObjCopy = { ...originalObj };

    const result = await safeSubmit(10, 'hello', originalObj);

    assertEquals(result, '10hello[object Object]');
    assertEquals(receivedArgs[0], 10);
    assertEquals(receivedArgs[1], 'hello');
    assertEquals(receivedArgs[2], originalObj);
    assertEquals(JSON.stringify(originalObj), JSON.stringify(originalObjCopy));
  });

  await test('resolves all concurrent callers with return value', async () => {
    let executionCount = 0;
    const fn = async () => {
      executionCount++;
      await delay(30);
      return { success: true, id: 123 };
    };

    const safeSubmit = preventDuplicateSubmit(fn);
    const [res1, res2] = await Promise.all([safeSubmit(), safeSubmit()]);

    assertEquals(executionCount, 1);
    assertEquals(res1.success, true);
    assertEquals(res1.id, 123);
    assertEquals(res2.success, true);
    assertEquals(res2.id, 123);
  });

  await test('propagates rejection to all concurrent callers', async () => {
    const fn = async () => {
      await delay(20);
      throw new Error('Network error');
    };

    const safeSubmit = preventDuplicateSubmit(fn);
    const p1 = safeSubmit();
    const p2 = safeSubmit();

    let err1 = null;
    let err2 = null;

    try {
      await p1;
    } catch (err) {
      err1 = err;
    }

    try {
      await p2;
    } catch (err) {
      err2 = err;
    }

    assert(err1 !== null, 'first call should reject');
    assert(err2 !== null, 'second call should reject');
    assertEquals(err1.message, 'Network error');
    assertEquals(err2.message, 'Network error');
  });

  await test('allows a new execution after the previous promise resolves', async () => {
    let callCount = 0;
    const fn = async (val) => {
      callCount++;
      await delay(20);
      return `call-${callCount}: ${val}`;
    };

    const safeSubmit = preventDuplicateSubmit(fn);

    const firstResult = await safeSubmit('first');
    assertEquals(firstResult, 'call-1: first');
    assertEquals(callCount, 1);

    const secondResult = await safeSubmit('second');
    assertEquals(secondResult, 'call-2: second');
    assertEquals(callCount, 2);
  });

  await test('preserves the original this context', async () => {
    const formHandler = {
      endpoint: '/api/submit',
      async submit(data) {
        await delay(20);
        return `${this.endpoint} -> ${data}`;
      }
    };

    formHandler.safeSubmit = preventDuplicateSubmit(formHandler.submit);

    const result = await formHandler.safeSubmit('payload');
    assertEquals(result, '/api/submit -> payload');
  });

  await test('executes wrapped function only once during concurrent calls', async () => {
    let executions = 0;
    const fn = async () => {
      executions++;
      await delay(50);
      return executions;
    };

    const safeSubmit = preventDuplicateSubmit(fn);

    const promises = [
      safeSubmit(),
      safeSubmit(),
      safeSubmit(),
      safeSubmit(),
      safeSubmit()
    ];

    const results = await Promise.all(promises);

    assertEquals(executions, 1);
    results.forEach((r) => assertEquals(r, 1));
  });

  await test('allows a new execution after the previous promise rejects', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      await delay(20);
      if (attempts === 1) {
        throw new Error('First attempt failed');
      }
      return 'Second attempt succeeded';
    };

    const safeSubmit = preventDuplicateSubmit(fn);

    let firstError = null;
    try {
      await safeSubmit();
    } catch (err) {
      firstError = err;
    }

    assert(firstError !== null);
    assertEquals(firstError.message, 'First attempt failed');

    const secondResult = await safeSubmit();
    assertEquals(secondResult, 'Second attempt succeeded');
    assertEquals(attempts, 2);
  });

  await test('throws TypeError if argument is not a function', () => {
    const invalidInputs = [null, undefined, 123, 'function', {}, []];

    for (const input of invalidInputs) {
      let threw = false;
      try {
        preventDuplicateSubmit(input);
      } catch (err) {
        threw = true;
        assert(err instanceof TypeError);
        assertEquals(err.message, 'Expected a function');
      }
      assert(threw, `should throw for input: ${input}`);
    }
  });

  await test('handles synchronously throwing function and resets pending state', async () => {
    let callCount = 0;
    const fn = () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Sync error');
      }
      return Promise.resolve('recovered');
    };

    const safeSubmit = preventDuplicateSubmit(fn);

    let syncErr = null;
    try {
      await safeSubmit();
    } catch (err) {
      syncErr = err;
    }

    assert(syncErr !== null);
    assertEquals(syncErr.message, 'Sync error');

    const recovered = await safeSubmit();
    assertEquals(recovered, 'recovered');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
