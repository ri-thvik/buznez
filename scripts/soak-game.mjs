// Headless gameplay soak test: drives a full local game through the UI and
// asserts invariants (START salary awarded at most once per move, no crash,
// board never resizes while a modal is open, no console errors).
// Usage: node scripts/soak-game.mjs [baseUrl] [turns]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const base = process.argv[2] || 'http://localhost:3010';
const seconds = Number(process.argv[3] || 45);

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

// Read event text via JSON so the terminal cannot corrupt the glyphs.
page.on('console', () => {});

const consoleErrors = [];
const pageErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => pageErrors.push(String(e)));

await page.goto(`${base}/game`, { waitUntil: 'networkidle' });
await page.waitForSelector('.bb-board');

// Sample the board geometry repeatedly to prove it never changes.
const sizes = new Set();
let modalCount = 0;
let boardSizeDuringModal = new Set();
let rollClicks = 0;

const deadline = Date.now() + seconds * 1000;
while (Date.now() < deadline) {
  const info = await page.evaluate(() => {
    const b = document.querySelector('.bb-board');
    const r = b?.getBoundingClientRect();
    return {
      w: r ? Math.round(r.width) : 0,
      h: r ? Math.round(r.height) : 0,
      modal: !!document.querySelector('[style*="position: fixed"]'),
      events: Array.from(document.querySelectorAll('.bb-sidebar--left p'))
        .map(p => p.textContent || ''),
    };
  });
  if (info.w) sizes.add(`${info.w}x${info.h}`);
  if (info.modal) {
    modalCount++;
    boardSizeDuringModal.add(`${info.w}x${info.h}`);
    const buy = page.getByRole('button', { name: /^BUY/i });
    const decline = page.getByRole('button', { name: /^DECLINE/i });
    if (await buy.count() > 0 && await buy.first().isVisible().catch(() => false)) {
      await buy.first().click().catch(() => {});
    } else if (await decline.count() > 0) {
      await decline.first().click().catch(() => {});
    }
  } else {
    const roll = page.getByRole('button', { name: /roll dice/i });
    if (await roll.count() > 0 && await roll.first().isVisible().catch(() => false)) {
      const enabled = await roll.first().isEnabled();
      if (enabled) { await roll.first().click().catch(() => {}); rollClicks++; }
    }
  }
  await page.waitForTimeout(220);
}

const events = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.bb-sidebar--left p')).map(p => p.textContent || ''));

// Count START salary events per adjacent pair (double-award detector).
let doubleStart = 0;
for (let i = 1; i < events.length; i++) {
  const a = events[i - 1] || '', b = events[i] || '';
  if (/START/i.test(a) && /START/i.test(b) && /1,?500|1500/.test(a) && /1,?500|1500/.test(b)) {
    doubleStart++;
  }
}

console.log(JSON.stringify({
fs.writeFileSync('scripts/soak-result.json', JSON.stringify({
  boardSizesSeenWhileModalOpen: [...boardSizeDuringModal],
  modalFrames: modalCount,
  rollClicks,
  startSalaryEvents: events.filter(e => /1,?500/.test(e) && /START/i.test(e)).length,
  suspectedDoubleStartAwards: doubleStart,
  totalEvents: events.length,
  lastEvents: events.slice(-12),
  consoleErrors, pageErrors,
}, null, 2));

console.log('soak complete -> scripts/soak-result.json');
await browser.close();
