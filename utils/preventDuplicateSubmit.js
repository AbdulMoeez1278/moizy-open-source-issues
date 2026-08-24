/**
 * Prevents concurrent executions of an asynchronous function.
 * Returns the existing in-flight promise while pending.
 *
 * @param {Function} fn
 * @returns {Function}
 */
function preventDuplicateSubmit(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function');
  }

  let pendingPromise = null;

  return function (...args) {
    if (pendingPromise) {
      return pendingPromise;
    }

    try {
      pendingPromise = Promise.resolve(fn.apply(this, args)).finally(() => {
        pendingPromise = null;
      });
    } catch (error) {
      pendingPromise = null;
      return Promise.reject(error);
    }

    return pendingPromise;
  };
}

module.exports = preventDuplicateSubmit;
