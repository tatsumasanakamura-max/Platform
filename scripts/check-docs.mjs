import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const markdownFiles = execFileSync(
  'git',
  [
    '-c',
    'safe.directory=' + process.cwd(),
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '*.md',
  ],
  {
    encoding: 'utf8',
  },
)
  .split(/\r?\n/u)
  .filter(Boolean);
const failures = [];
const linkPattern = /\[[^\]]+\]\((?!https?:|#)([^)]+)\)/gu;

for (const file of markdownFiles) {
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(linkPattern)) {
    const target = decodeURIComponent(match[1].split('#')[0]);
    if (target && !existsSync(resolve(dirname(file), target))) {
      failures.push(`${file} -> ${match[1]}`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Broken document links:\n${failures.join('\n')}`);
}

process.stdout.write(`Document link check passed (${markdownFiles.length} files checked).\n`);
