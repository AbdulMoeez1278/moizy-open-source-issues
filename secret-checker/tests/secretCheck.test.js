const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');



const test = require('node:test');
const assert = require('node:assert/strict');

const { scanContent } = require('../lib/scanner');

test('detects an AWS access key', () => {
  const content = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';

  const results = scanContent(content);

  assert.equal(results.length, 1);
  assert.equal(results[0].type, 'AWS Access Key');
  assert.equal(results[0].line, 1);
});

test('detects a JWT token', () => {
  const content =
    'const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature";';

  const results = scanContent(content);

  assert.equal(results.length, 1);
  assert.equal(results[0].type, 'JWT Token');
  assert.equal(results[0].line, 1);
});

test('detects a private key', () => {
  const content = `-----BEGIN PRIVATE KEY-----
some-private-key-data
-----END PRIVATE KEY-----`;

  const results = scanContent(content);

  assert.equal(results.length, 1);
  assert.equal(results[0].type, 'Private Key');
  assert.equal(results[0].line, 1);
});

test('detects a password assignment', () => {
  const content = 'password = "mySecretPassword123"';

  const results = scanContent(content);

  assert.equal(results.length, 1);
  assert.equal(results[0].type, 'Password');
  assert.equal(results[0].line, 1);
});

test('detects an API key assignment', () => {
  const content = 'const apiKey = "sk_live_123456789abcdef";';

  const results = scanContent(content);

  assert.equal(results.length, 1);
  assert.equal(results[0].type, 'API Key');
  assert.equal(results[0].line, 1);
});

test('detects a database connection string', () => {
  const content =
    'const database = "postgresql://admin:secret123@db.example.com:5432/app";';

  const results = scanContent(content);

  assert.equal(results.length, 1);
  assert.equal(results[0].type, 'Database Connection String');
  assert.equal(results[0].line, 1);
});

test('reports the correct line number', () => {
  const content = `const name = "test";
const value = "hello";
const password = "secret123";`;

  const results = scanContent(content);

  assert.equal(results.length, 1);
  assert.equal(results[0].line, 3);
});

test('does not flag environment variable references', () => {
  const content = `
const password = process.env.PASSWORD;
const apiKey = process.env.API_KEY;
`;

  const results = scanContent(content);

  assert.equal(results.length, 0);
});

test('allows intentional findings to be suppressed', () => {
  const content = 'const apiKey = "example_key_12345678"; // secret-check-ignore';

  const results = scanContent(content);

  assert.equal(results.length, 0);
});

test('does not flag normal configuration values', () => {
  const content = `
const username = "john";
const port = 3000;
const apiKey = config.apiKey;
`;

  const results = scanContent(content);

  assert.equal(results.length, 0);
});

test('returns no findings for ordinary source code', () => {
  const content = `
function greet(name) {
  return "Hello " + name;
}

console.log(greet("John"));
`;

  const results = scanContent(content);

  assert.deepEqual(results, []);
});

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'secret-checker-test-'));
}

function runGit(args, cwd) {
  return spawnSync('git', args, {
    cwd,
    encoding: 'utf8'
  });
}

function runCli(cwd) {
  const cliPath = path.join(__dirname, '..', 'secret-check.js');

  return spawnSync(process.execPath, [cliPath], {
    cwd,
    encoding: 'utf8'
  });
}

test('scans secrets from Git-staged files', () => {
  const cwd = makeTempDir();

  runGit(['init'], cwd);
  runGit(['config', 'user.email', 'test@example.com'], cwd);
  runGit(['config', 'user.name', 'Test User'], cwd);

  fs.writeFileSync(
    path.join(cwd, 'config.js'),
    'const apiKey = "sk_live_123456789abcdef";\n'
  );

  runGit(['add', 'config.js'], cwd);

  const result = runCli(cwd);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /File: config\.js/);
  assert.match(result.stdout, /Line: 1/);
  assert.match(result.stdout, /Type: API Key/);
});

test('scans the staged version of a file', () => {
  const cwd = makeTempDir();
  const filePath = path.join(cwd, 'config.js');

  runGit(['init'], cwd);
  runGit(['config', 'user.email', 'test@example.com'], cwd);
  runGit(['config', 'user.name', 'Test User'], cwd);

  fs.writeFileSync(
    filePath,
    'const password = "secret123";\n'
  );

  runGit(['add', 'config.js'], cwd);

  fs.writeFileSync(
    filePath,
    'const password = process.env.PASSWORD;\n'
  );

  const result = runCli(cwd);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Type: Password/);
});

test('ignores binary staged files', () => {
  const cwd = makeTempDir();

  runGit(['init'], cwd);
  runGit(['config', 'user.email', 'test@example.com'], cwd);
  runGit(['config', 'user.name', 'Test User'], cwd);

  const binaryPath = path.join(cwd, 'image.bin');

  fs.writeFileSync(
    binaryPath,
    Buffer.from([0, 1, 2, 3, 4, 5])
  );

  runGit(['add', 'image.bin'], cwd);

  const result = runCli(cwd);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /No potential secrets detected/);
});
