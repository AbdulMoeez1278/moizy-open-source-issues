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
  };
};

// Save original console.error
const originalConsoleError = console.error;

// Spy function to capture console.error messages
let consoleOutput = [];
const mockConsoleError = (message) => consoleOutput.push(message);
console.error = mockConsoleError;

test('valid email returns true', () => assertEquals(validateEmail('test@yahoo.com'), true));


test('invalid email returns false', () => {
  assertEquals(validateEmail('abc.com'), false);
});
