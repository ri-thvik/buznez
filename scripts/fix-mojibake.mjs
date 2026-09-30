// One-off repair: some files were re-encoded by PowerShell and contain
// UTF-8 bytes that were decoded as Windows-1252 (mojibake).
// Re-interprets the current text as latin1 bytes -> utf8 string.
import fs from 'node:fs';

const files = process.argv.slice(2);
for (const f of files) {
  const buf = fs.readFileSync(f);
  const text = buf.toString('utf8');
  if (!/[ÃÂâ€]/.test(text)) { console.log(`skip (clean): ${f}`); continue; }
  const fixed = Buffer.from(text, 'latin1').toString('utf8');
  if (!/[ÃÂâ€]/.test(fixed)) {
    fs.writeFileSync(f, fixed, 'utf8');
    console.log(`fixed: ${f}`);
  } else {
    console.log(`partial (manual review needed): ${f}`);
  }
}
