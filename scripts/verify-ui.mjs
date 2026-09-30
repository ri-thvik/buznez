// Visual verification harness (dev-only, not part of the app bundle).
// Usage: node scripts/verify-ui.mjs [baseUrl] [viewportW] [viewportH]
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const base = process.argv[2] || 'http://localhost:3000';
const W = Number(process.argv[3] || 1600);
const H = Number(process.argv[4] || 900);

fs.mkdirSync('scripts/screenshots', { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
const page = await ctx.newPage();

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => pageErrors.push(String(e)));
page.on('requestfailed', r => failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`));

await page.goto(`${base}/game`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('.bb-board', { timeout: 20000 });
await page.waitForTimeout(3500);

// Clear blocking decision modals so the board itself can be judged.
for (let i = 0; i < 6; i++) {
  const decline = page.getByRole('button', { name: /DECLINE/i });
  if (await decline.count() > 0 && await decline.first().isVisible().catch(() => false)) {
    await decline.first().click();
    await page.waitForTimeout(900);
  } else break;
}
await page.waitForTimeout(1500);

const metrics = await page.evaluate(() => {
  const box = el => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      right: Math.round(r.right), bottom: Math.round(r.bottom),
    };
  };
  const board = document.querySelector('.bb-board');
  const left = document.querySelector('.bb-sidebar--left');
  const right = document.querySelector('.bb-sidebar--right');
  const bt = board ? board.getBoundingClientRect() : null;

  // Per-city-tile readability: computed font size + rendered line count.
  const tileText = Array.from(document.querySelectorAll('.bb-tile[data-type="PROPERTY"]'))
    .map(t => {
      const span = t.querySelector('span.font-bold');
      if (!span) return null;
      const cs = getComputedStyle(span);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.05;
      const inner = t.querySelector('[class*="bb-tile-inner"]');
      // offsetWidth/Height are layout sizes (pre-transform), so they stay
      // meaningful on the 90°-rotated left/right tiles.
      return {
        name: (span.textContent || '').trim(),
        fontPx: Math.round(parseFloat(cs.fontSize) * 10) / 10,
        lines: Math.max(1, Math.round(span.offsetHeight / lh)),
        spanW: span.offsetWidth,
        tileW: t.offsetWidth,
        innerW: inner ? inner.offsetWidth : null,
        rotated: !!inner,
      };
    })
    .filter(Boolean);

  return {
    viewport: { w: innerWidth, h: innerHeight },
    hasHorizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    hasVerticalOverflow: document.documentElement.scrollHeight > innerHeight + 1,
    board: box(board),
    stage: box(document.querySelector('.bb-board-stage')),
    left: box(left),
    right: box(right),
    header: box(document.querySelector('.bb-header')),
    actionbar: box(document.querySelector('.bb-actionbar')),
    tileCount: document.querySelectorAll('.bb-tile').length,
    playersRendered: document.querySelectorAll('.bb-sidebar--right .rounded-lg').length,
    leftOverlapsBoard: !!(left && bt && left.getBoundingClientRect().right > bt.x + 1),
    rightOverlapsBoard: !!(right && bt && right.getBoundingClientRect().left < bt.right - 1),
    boardInsideViewport: !!(bt && bt.right <= innerWidth + 1 && bt.bottom <= innerHeight + 1),
    minFontPx: tileText.length ? Math.min(...tileText.map(t => t.fontPx)) : null,
    maxFontPx: tileText.length ? Math.max(...tileText.map(t => t.fontPx)) : null,
    wrappedTiles: tileText.filter(t => t.lines > 1).map(t => t.name + ' (' + t.lines + 'L)'),
    tileText,
  };
});

await page.screenshot({ path: `scripts/screenshots/game-${W}x${H}.png` });
console.log(JSON.stringify({ metrics, consoleErrors, pageErrors, failedRequests }, null, 2));

await browser.close();
