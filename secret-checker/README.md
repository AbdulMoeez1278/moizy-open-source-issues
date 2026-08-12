# Secret Checker

Secret Checker is a small CLI utility that scans Git-staged files for values that may contain sensitive information before they are committed.

It is intended to catch common mistakes such as accidentally staging API keys, passwords, tokens, private keys, or database credentials.

## Usage

Run the checker from the repository root:

```bash
node secret-checker/secret-check.js
```

The checker scans only files currently staged in Git.
If a possible secret is found, the commit is blocked:

```
🔍 Scanning staged files...

❌ Possible secret detected

File: src/config.js
Line: 12
Type: API Key

⚠ Commit blocked.
Remove the sensitive value before committing.
```

When no suspicious values are found:

```
🔍 Scanning staged files...

✅ No potential secrets detected.
Safe to continue.
```

The process exits with status `1` when potential secrets are detected and `0` when the staged files are clean.

## Detected Secret Types

The checker currently looks for:

* AWS-style access keys
* JWT tokens
* Private keys
* Password assignments
* API key assignments
* Database connection strings

The patterns are intended to identify values that look suspicious. They do not attempt to verify whether a credential is valid.

## False-Positive Suppression

If a line intentionally contains a value that matches one of the detection patterns, add `secret-check-ignore` to that line:

```js
const apiKey = "example_key_12345678"; // secret-check-ignore
```

That line will be ignored by the scanner.
This should only be used when the matched value is known to be safe.

## Git-Staged Files

The checker reads the staged version of each file rather than the current working-tree version.
For example, if a secret is staged but then removed from the working file, the staged secret will still be detected.
Binary staged files are skipped.

## Tests

Run the test suite with:

```bash
node --test secret-checker/tests/secretCheck.test.js
```

The tests cover:

* Secret pattern detection
* Line number reporting
* Environment variable references
* Normal configuration values
* False-positive suppression
* Git-staged file scanning
* Scanning the staged version of a modified file
* Binary file handling
* Exit statuses

## Possible Future Use

The checker can be integrated into a Git pre-commit hook or CI workflow to help prevent accidental credential leaks.