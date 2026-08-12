const { execFileSync } = require('node:child_process');

const { scanContent } = require('./lib/scanner');

function getStagedFiles() {
  const output = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    { encoding: 'utf8' }
  );

  return output.split(/\r?\n/).filter(Boolean);
}

function getStagedContent(file) {
  return execFileSync('git', ['show', `:${file}`]);
}

function isBinaryFile(buffer) {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }

  return false;
}

function main() {
  console.log('🔍 Scanning staged files...\n');

  let stagedFiles;

  try {
    stagedFiles = getStagedFiles();
  } catch (error) {
    console.error('Unable to read Git staged files.');
    process.exitCode = 1;
    return;
  }

  let findings = [];

  for (const file of stagedFiles) {
    const stagedContent = getStagedContent(file);

    if (isBinaryFile(stagedContent)) {
      continue;
    }

    const content = stagedContent.toString('utf8');
    const fileFindings = scanContent(content);

    findings = findings.concat(
      fileFindings.map((finding) => ({
        ...finding,
        file
      }))
    );
  }

  if (findings.length === 0) {
    console.log('✅ No potential secrets detected.');
    console.log('Safe to continue.');
    return;
  }

  for (const finding of findings) {
    console.log('❌ Possible secret detected\n');
    console.log(`File: ${finding.file}`);
    console.log(`Line: ${finding.line}`);
    console.log(`Type: ${finding.type}`);
    console.log('');
  }

  console.log('⚠ Commit blocked.');
  console.log('Remove the sensitive value before committing.');

  process.exitCode = 1;
}

main();
