// Cleans mojibake caused by earlier PowerShell re-encodings.
// - U+FFFD runs in comments -> replaced with an ASCII box-drawing char
// - 'â¬¦' / 'â€¦' -> '...' (ellipsis) in user-visible strings
// Usage: node scripts/clean-text.mjs <file...>
import fs from 'node:fs';

for (const f of process.argv.slice(2)) {
  let t = fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '');
  const before = t;
  t = t.replace(/\u00e2\u00ac\u00a6|\u00e2\u0080\u00a6/g, '...');   // â¬¦ / â€¦
  t = t.replace(/\u00e2\u20ac\u201e/g, '-');                        // box rule
  t = t.replace(/\u00e2\u201e/g, '-');
  t = t.replace(/\ufffd+/g, '-');                                  // any remaining junk
  t = t.replace(/[\u00c2\u00c3]/g, '');                            // stray Â / Ã
  if (t !== before) { fs.writeFileSync(f, t, 'utf8'); console.log('cleaned: ' + f); }
  else console.log('unchanged: ' + f);
}
