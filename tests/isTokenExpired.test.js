const { test, assertEquals, assert, printSummary } = require('./test-utils.js');
const isTokenExpired = require('../utils/isTokenExpired.js');

// ---------------------------------------------------------------------------
// Helpers — build real Base64Url-encoded tokens without any library
// ---------------------------------------------------------------------------

/**
 * Builds a minimal JWT-shaped string with the given payload.
 * The header and signature are stubs; the payload is real Base64Url JSON.
 *
 * @param {object} payload
 * @returns {string}
 */
function makeToken(payload) {
  const header = Buffer.from('{"alg":"HS256"}').toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.stub-signature`;
}

const PAST_EXP = 1;             // Unix epoch second well in the past
const FUTURE_EXP = 9999999999;  // Year 2286 — safely in the future

// ---------------------------------------------------------------------------
// Valid, unexpired token
// ---------------------------------------------------------------------------

test('valid unexpired token returns false', () => {
  const token = makeToken({ sub: 'user-1', exp: FUTURE_EXP });
  assertEquals(isTokenExpired(token), false);
});

// ---------------------------------------------------------------------------
// Expired token
// ---------------------------------------------------------------------------

test('expired token returns true', () => {
  const token = makeToken({ sub: 'user-1', exp: PAST_EXP });
  assertEquals(isTokenExpired(token), true);
});

// ---------------------------------------------------------------------------
// Token with future expiration (same as "valid unexpired", explicit label)
// ---------------------------------------------------------------------------

test('token with far-future exp returns false', () => {
  const token = makeToken({ exp: FUTURE_EXP, role: 'admin' });
  assertEquals(isTokenExpired(token), false);
});

// ---------------------------------------------------------------------------
// Missing `exp` claim
// ---------------------------------------------------------------------------

test('token without exp claim returns true', () => {
  const token = makeToken({ sub: 'user-1', role: 'reader' });
  assertEquals(isTokenExpired(token), true);
});

// ---------------------------------------------------------------------------
// Malformed JWT — not three dot-separated segments
// ---------------------------------------------------------------------------

test('completely non-JWT string returns true', () => {
  assertEquals(isTokenExpired('not.a.jwt.at.all'), true);
});

test('only two segments returns true', () => {
  assertEquals(isTokenExpired('header.payload'), true);
});

test('token with corrupted payload returns true', () => {
  assertEquals(isTokenExpired('header.!!!invalid-base64!!$.signature'), true);
});

// ---------------------------------------------------------------------------
// Empty / blank / non-string input
// ---------------------------------------------------------------------------

test('empty string returns true', () => {
  assertEquals(isTokenExpired(''), true);
});

test('whitespace-only string returns true', () => {
  assertEquals(isTokenExpired('   '), true);
});

test('null input returns true', () => {
  assertEquals(isTokenExpired(null), true);
});

test('undefined input returns true', () => {
  assertEquals(isTokenExpired(undefined), true);
});

test('number input returns true', () => {
  assertEquals(isTokenExpired(12345), true);
});

test('object input returns true', () => {
  assertEquals(isTokenExpired({}), true);
});

// ---------------------------------------------------------------------------
// Invalid payload structure — JSON that is not an object
// ---------------------------------------------------------------------------

test('payload that is a JSON array returns true', () => {
  const header = Buffer.from('{"alg":"HS256"}').toString('base64url');
  const body = Buffer.from(JSON.stringify([1, 2, 3])).toString('base64url');
  const token = `${header}.${body}.sig`;
  assertEquals(isTokenExpired(token), true);
});

test('payload that is a JSON string returns true', () => {
  const header = Buffer.from('{"alg":"HS256"}').toString('base64url');
  const body = Buffer.from(JSON.stringify('hello')).toString('base64url');
  const token = `${header}.${body}.sig`;
  assertEquals(isTokenExpired(token), true);
});

// ---------------------------------------------------------------------------
// Non-numeric `exp` values
// ---------------------------------------------------------------------------

test('exp is a string returns true', () => {
  const token = makeToken({ exp: '9999999999' });
  assertEquals(isTokenExpired(token), true);
});

test('exp is null returns true', () => {
  const token = makeToken({ exp: null });
  assertEquals(isTokenExpired(token), true);
});

test('exp is Infinity returns true', () => {
  // JSON.stringify converts Infinity to null, so parse side will see null
  const header = Buffer.from('{"alg":"HS256"}').toString('base64url');
  const body = Buffer.from('{"exp":null}').toString('base64url');
  const token = `${header}.${body}.sig`;
  assertEquals(isTokenExpired(token), true);
});

// ---------------------------------------------------------------------------
// Security assertion — isTokenExpired must not log the token value
// ---------------------------------------------------------------------------

test('no token value is logged to console (security)', () => {
  const spy = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => spy.push(args.join(' '));
  console.error = (...args) => spy.push(args.join(' '));
  console.warn = (...args) => spy.push(args.join(' '));

  const sensitiveToken = makeToken({ sub: 'secret-user-id', exp: FUTURE_EXP });
  isTokenExpired(sensitiveToken);

  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;

  // None of the captured log lines should contain the token string
  const tokenLogged = spy.some((line) => line.includes(sensitiveToken));
  assert(!tokenLogged, 'Token value must not be logged by isTokenExpired');
});

// ---------------------------------------------------------------------------

printSummary();
