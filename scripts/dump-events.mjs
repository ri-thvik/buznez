// Dumps the live event-log text so glyph correctness can be checked
// without the terminal re-encoding it.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const base = process.argv[2] || 'http://localhost:3010';
const seconds = Number(process.argv[3] || 60);

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));

await page.goto(`${base}/game`, { waitUntil: 'networkidle' });
await page.waitForSelector('.bb-board');

const deadline = Date.now() + seconds * 1000;
while (Date.now() < deadline) {
  const has = await page.evaluate(() => {
    const buy = Array.from(document.querySelectorAll('button')).find(b => /^BUY/i.test(b.textContent || ''));
    const dec = Array.from(document.querySelectorAll('button')).find(b => /^DECLINE/i.test(b.textContent || ''));
    const roll = Array.from(document.querySelectorAll('button')).find(b => /roll dice/i.test(b.textContent || '') && !b.disabled);
    if (buy && !buy.disabled) { buy.click(); return 'buy'; }
    if (dec) { dec.click(); return 'decline'; }
    if (roll) { roll.click(); return 'roll'; }
    return null;
  });
  void has;
  await page.waitForTimeout(220);
}

const events = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.bb-sidebar--left p')).map(p => p.textContent || ''));

fs.writeFileSync('scripts/events-dump.json', JSON.stringify({ events, errors }, null, 2));
console.log('events:', events.length, 'errors:', errors.length);
await browser.close();
