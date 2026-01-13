
export function throttle(fn, delay) {
  // Tracks whether we are currently in the "cooldown" period.
  let timeoutId = null;

  // Return a new function that wraps the original `fn`.
  return function throttled(...args) {
    // Preserve the original `this` value where the function is called.
    const context = this;

    // Only run if we are not in the cooldown period.
    if (timeoutId === null) {
      // 1) Run the original function immediately (leading edge).
      fn.apply(context, args);

      // 2) Start the cooldown timer.
      timeoutId = setTimeout(() => {
        // After `delay` ms, allow the next execution.
        timeoutId = null;
      }, delay);
    }
    // If timeoutId is not null, calls are ignored until cooldown ends.
  };
}

// default export for convenient importing.
export default throttle;
