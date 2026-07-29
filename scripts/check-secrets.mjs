import process from 'node:process';
import { execFileSync } from 'node:child_process';

const tracked = execFileSync(
  'git',
  [
    '-c',
    'safe.directory=' + process.cwd(),
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
  ],
  {
    encoding: 'utf8',
  },
)
  .split(/\r?\n/u)
  .filter(Boolean)
  .filter((file) => !file.endsWith('package-lock.json'));

const suspicious = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /AIza[0-9A-Za-z_-]{35}/u,
  /(?:password|secret|api[_-]?key)\s*[:=]\s*['"][^'"]{8,}/iu,
];

const { readFileSync } = await import('node:fs');
const hits = tracked.flatMap((file) => {
  const content = readFileSync(file, 'utf8');
  return suspicious.some((pattern) => pattern.test(content)) ? [file] : [];
});

if (hits.length > 0) {
  throw new Error(`Potential secrets found in: ${hits.join(', ')}`);
}

process.stdout.write(`Secret scan passed (${tracked.length} tracked files checked).\n`);
