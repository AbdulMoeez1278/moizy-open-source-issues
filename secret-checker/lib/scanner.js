const patterns = [
  {
    type: 'Private Key',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/
  },
  {
    type: 'AWS Access Key',
    regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/
  },
  {
    type: 'JWT Token',
    regex: /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/
  },
  {
    type: 'Database Connection String',
    regex: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^/\s:@]+:[^/\s@]+@/
  },
  {
    type: 'Password',
    regex: /\bpassword\s*[:=]\s*["'`](?!process\.env\b)[^"'`\s]{6,}["'`]/i
  },
  {
    type: 'API Key',
    regex: /\bapi[_-]?key\s*[:=]\s*["'`](?!process\.env\b)[^"'`\s]{8,}["'`]/i
  }
];

function scanContent(content) {
  const findings = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (line.includes('secret-check-ignore')) {
      return;
    }

    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        findings.push({
          line: index + 1,
          type: pattern.type,
          match: line.trim()
        });

        break;
      }
    }
  });

  return findings;
}

module.exports = { scanContent };
