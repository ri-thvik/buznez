// Replaces line N (1-based) of a file with the given text, writing
// UTF-8 without a BOM (PowerShell 5.1 always emits a BOM, which makes
// TypeScript treat .tsx files as binary).
// Usage: node scripts/setline.mjs <file> <lineNumber> <text>
import fs from 'node:fs';

const [file, lineNo, text] = process.argv.slice(2);
const n = Number(lineNo);
const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
lines[n - 1] = text;
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log(`${file}:${n} -> ${text}`);
