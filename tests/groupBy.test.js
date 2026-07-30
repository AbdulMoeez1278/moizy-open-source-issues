const groupBy = require('../utils/groupBy');

const users = [
  { name: 'Ali', role: 'admin' },
  { name: 'Moeez', role: 'user' },
  { name: 'Ahmed', role: 'admin' }
];

console.log(groupBy(users, 'role'));

console.log(groupBy(users, (user) => user.role));

console.log(groupBy([], 'role'));

console.log(groupBy(null, 'role'));

console.log(groupBy(users, 'missing'));

const mixedItems = [
  { value: 1, type: 'number' },
  { value: 'hello', type: 'string' },
  { value: true, type: 'boolean' }
];

console.log(groupBy(mixedItems, 'type'));

const callbackUndefined = [
  { name: 'Item 1' },
  { name: 'Item 2' }
];

console.log(groupBy(callbackUndefined, () => undefined));

console.log(users);

// Edge Cases

// 1. Boolean keys
const booleanItems = [
  { name: "A", active: true },
  { name: "B", active: false },
  { name: "C", active: true }
];
console.log(groupBy(booleanItems, item => item.active));

// 2. Numeric keys
const numericItems = [
  { 0: "A" },
  { 0: "B" },
  { 1: "C" }
];
console.log(groupBy(numericItems, 0));

// 3. Prototype keys (should not overwrite existing prototype properties)
const protoKeys = [
  { key: "constructor", val: 1 },
  { key: "__proto__", val: 2 }
];
console.log(groupBy(protoKeys, item => item.key));