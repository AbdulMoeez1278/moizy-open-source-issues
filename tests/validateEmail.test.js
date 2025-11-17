'use strict';

const { validateEmail } = require('../src/validateEmail.js');

const test = (name, fn) => {
  try {
    fn();
    console.log(`✔️ ${name}`);
  } catch (err) {
    console.error(`❌ ${name}`);
    console.error('   ', err.message);
  }
};

const assertEquals = (actual, expected) => {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}`);
  }
};

test('valid email returns true', () => {
  assertEquals(validateEmail('test@yahoo.com'), true);
});

test('invalid email returns false', () => {
  assertEquals(validateEmail('abc.com'), false);
});
