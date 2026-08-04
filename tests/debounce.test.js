const debounce = require("../utils/debounce");

jest.useFakeTimers();

test("debounce delays function execution", () => {
  let count = 0;
  const increment = () => count++;
  const debounced = debounce(increment, 300);

  debounced();
  expect(count).toBe(0);

  jest.advanceTimersByTime(300);
  expect(count).toBe(1);
});

test("debounce only calls the function once for rapid successive calls", () => {
  let count = 0;
  const increment = () => count++;
  const debounced = debounce(increment, 300);

  debounced();
  debounced();
  debounced();

  jest.advanceTimersByTime(300);
  expect(count).toBe(1);
});

test("debounce preserves the calling context (this)", () => {
  const user = {
    name: "Moeez",
    greet: debounce(function () {
      this.captured = this.name;
    }, 300),
  };

  user.greet();
  jest.advanceTimersByTime(300);

  expect(user.captured).toBe("Moeez");
});

test("debounce forwards arguments correctly", () => {
  let received;
  const fn = (a, b) => {
    received = a + b;
  };
  const debounced = debounce(fn, 300);

  debounced(2, 3);
  jest.advanceTimersByTime(300);

  expect(received).toBe(5);
});