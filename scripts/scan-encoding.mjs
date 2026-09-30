import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

for (const f of walk('src').filter(f => /\.(ts|tsx|css)$/.test(f))) {
  const text = fs.readFileSync(f, 'utf8');
  const bad = text.split('\n')
    .map((l, i) => [i + 1, l])
    .filter(([, l]) => /[\u00C2\u00C3\u00E2\u2205\uFFFD]/.test(l));
  if (bad.length) {
    console.log(`\n=== ${f} (${bad.length}) ===`);
    bad.slice(0, 40).forEach(([n, l]) => console.log(`${n}: ${l.trim().slice(0, 130)}`));
  }
}
