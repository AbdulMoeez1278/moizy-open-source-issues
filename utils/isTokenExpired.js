/**
 * isTokenExpired Utility
 * ----------------------
 * Checks whether a JWT access token has expired by inspecting
 * the `exp` claim in its payload.
 *
 * This utility does NOT verify the JWT signature and must NOT
 * be used as a substitute for proper JWT signature verification
 * or authentication.
 */

/**
 * Decodes the Base64Url-encoded payload segment of a JWT without
 * verifying the signature.
 *
 * @param {string} token - A JWT string in the format header.payload.signature
 * @returns {object|null} Parsed payload object, or null if decoding fails
 */
function decodePayload(token) {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    // Replace Base64Url characters with standard Base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');

    // Pad to a multiple of 4
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const decoded = Buffer.from(padded, 'base64').toString('utf8');

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Checks whether a JWT token is expired by reading the `exp` claim.
 *
 * - Returns `true` if the token is expired or if the expiration cannot
 *   be determined (malformed token, missing `exp`, invalid input).
 * - Returns `false` if the token contains a valid `exp` claim that is
 *   in the future.
 * - Does not log or expose the token value at any point.
 * - Does not verify the JWT signature.
 *
 * @param {string} token - A JWT string to inspect
 * @returns {boolean} `true` if expired or undeterminable, `false` if valid
 *
 * @example
 * isTokenExpired('eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig');
 * // false  (far-future expiry)
 *
 * isTokenExpired('eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjF9.sig');
 * // true  (exp = 1, long expired)
 *
 * isTokenExpired('not.a.jwt');
 * // true  (malformed payload)
 */
function isTokenExpired(token) {
  // Reject non-string or empty input — treat as expired/unknown
  if (typeof token !== 'string' || token.trim() === '') {
    return true;
  }

  const payload = decodePayload(token);

  // If decoding failed or payload is not an object, treat as expired
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return true;
  }

  // If there is no `exp` claim we cannot determine expiry; treat as expired
  if (!Object.prototype.hasOwnProperty.call(payload, 'exp')) {
    return true;
  }

  const exp = payload.exp;

  // `exp` must be a finite number; anything else is treated as expired
  if (typeof exp !== 'number' || !isFinite(exp)) {
    return true;
  }

  // JWT `exp` is in seconds; Date.now() is in milliseconds
  const nowInSeconds = Math.floor(Date.now() / 1000);

  return nowInSeconds >= exp;
}

module.exports = isTokenExpired;
