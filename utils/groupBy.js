/**
 * Groups an array of items by a key or callback function.
 *
 * @param {Array} array
 * @param {string|Function} keyOrFn
 * @returns {Object}
 */
function groupBy(array, keyOrFn) {
  if (!Array.isArray(array)) {
    return {};
  }

  const isValidKey = ['string', 'number', 'boolean', 'symbol'].includes(typeof keyOrFn);
  if (!isValidKey && typeof keyOrFn !== 'function') {
    return {};
  }

  return array.reduce((result, item) => {
    const groupKey = typeof keyOrFn === 'function'
      ? keyOrFn(item)
      : item && item[keyOrFn];

    const normalizedKey = String(groupKey);

    if (!Object.prototype.hasOwnProperty.call(result, normalizedKey)) {
      result[normalizedKey] = [];
    }

    result[normalizedKey].push(item);

    return result;
  }, {});
}

module.exports = groupBy;