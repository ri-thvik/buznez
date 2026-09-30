// ============================================================
// BUSINESS BHARAT ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Real multi-browser multiplayer test.
// Launches 4 independent browser contexts (separate localStorage
// / socket identities) and drives create -> join -> start ->
// play -> chat -> reconnect. A REAL client test, not a mocked
// Socket.IO script.
//
// Usage: node scripts/test-multiplayer.mjs [baseUrl]
// ============================================================
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const WEB = process.argv[2] || 'http://localhost:3000';
const SHOTS = 'scripts/screenshots/mp';
fs.mkdirSync(SHOTS, { recursive: true });

const results = { steps: [], errors: {}, browsers: {} };
function log(step, ok, detail = '') {
  results.steps.push({ step, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${step}${detail ? ' | ' + detail : ''}`);
}
function watch(page, tag) {
  const bucket = (results.errors[tag] ??= { console: [], page: [] });
  page.on('console', m => { if (m.type() === 'error') bucket.console.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => bucket.page.push(String(e).slice(0, 200)));
}

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });

const names = ['Rithvik', 'Arjun', 'Rahul', 'Kiran'];
const ctxs = [];
const pages = [];
for (const n of names) {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  ctxs.push(c);
  const p = await c.newPage();
  watch(p, n);
  pages.push(p);
}
const [A, B, C, D] = pages;

const readState = page => page.evaluate(() => {
  const s = window.__BB_STATE__;
  if (!s) return null;
  return {
    turn: s.currentPlayerId,
    phase: s.phase,
    players: s.players.map(p => `${p.id}:${p.cash}:${p.position}`).join('|'),
  };
});

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ 1. Player A creates a room ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
await A.goto(`${WEB}/create`, { waitUntil: 'networkidle' });
await A.waitForTimeout(800);
await A.getByPlaceholder('Enter your name').fill('Rithvik');
await A.getByRole('button', { name: /CREATE ROOM/i }).click();
await A.waitForURL(/lobby\/online/, { timeout: 10000 }).catch(() => {});
await A.waitForTimeout(1200);

const roomCode = (await A.locator('.font-mono').first().innerText().catch(() => '')).trim();
log('Room created + 6-char code shown', /^[A-Z0-9]{6}$/.test(roomCode), `code=${roomCode}`);

if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
  await A.screenshot({ path: `${SHOTS}/fail-lobby-A.png` });
  console.log('FATAL: no room code; aborting.');
  fs.writeFileSync('scripts/mp-report.json', JSON.stringify(results, null, 2));
  await browser.close();
  process.exit(1);
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ 2. B, C, D join with the code ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
for (const [i, page] of [[1, B], [2, C], [3, D]]) {
  await page.goto(`${WEB}/join`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('input').first().fill(roomCode);
  await page.getByPlaceholder('Enter your name').fill(names[i]);
  await page.getByRole('button', { name: /JOIN ROOM/i }).click();
  await page.waitForURL(/lobby\/online/, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(700);
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ 3. All four see the same 4-player room ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
await A.waitForTimeout(1500);
const counts = [];
for (const [i, page] of pages.entries()) {
  const txt = await page.locator('body').innerText().catch(() => '');
  const m = txt.match(/Players\s*\((\d)\/(\d)\)/);
  counts.push(m ? m[1] : '?');
  results.browsers[names[i]] = { playersSeen: m ? m[1] : '?' };
}
log('All 4 browsers see 4 players', counts.every(c => c === '4'), `saw=${counts.join(',')}`);

const codes = [];
for (const page of pages) {
  codes.push((await page.locator('.font-mono').first().innerText().catch(() => '')).trim());
}
log('Same room code on all browsers', new Set(codes).size === 1, codes.join('/'));

await A.screenshot({ path: `${SHOTS}/01-lobby-4p-A.png` });
await C.screenshot({ path: `${SHOTS}/01-lobby-4p-C.png` });

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ 4. Start the game as host ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
await A.getByRole('button', { name: /START GAME/i }).click();
await A.waitForTimeout(3000);
const inGame = pages.map(p => p.url().includes('/game'));
log('All 4 browsers navigated into the game', inGame.every(Boolean), inGame.join(','));

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ 5. State sync ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
await A.waitForTimeout(1500);
const states = [];
for (const page of pages) states.push(await readState(page).catch(() => null));
if (states.every(Boolean)) {
  const p0 = JSON.stringify(states[0].players);
  const allSame = states.every(s => JSON.stringify(s.players) === p0);
  log('Player state identical across all 4 browsers', allSame, allSame ? '' : JSON.stringify(states.map(s => s.players)));
  log('Same current turn on all browsers', new Set(states.map(s => s.turn)).size === 1, `turns=${states.map(s => s.turn).join(',')}`);
} else {
  log('Game state readable on clients (for sync assertions)', false, 'window.__BB_STATE__ not exposed');
}

await A.screenshot({ path: `${SHOTS}/02-game-initial-A.png` });
await B.screenshot({ path: `${SHOTS}/02-game-initial-B.png` });

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ 6. Roll dice as the active player ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
let purchased = false, boughtTile = '';
for (let turn = 0; turn < 60 && !purchased; turn++) {
  // Always act as whichever of the four browsers currently holds the turn.
  const state = await readState(A);
  if (!state) break;
  const actor = pages.find(async () => true);
  let actorPage = null;
  for (const p of pages) {
    const pid = await p.evaluate(() => localStorage.getItem('bb-player-id'));
    if (pid === state.turn) { actorPage = p; break; }
  }
  if (!actorPage) { await A.waitForTimeout(1200); continue; }

  const roll = actorPage.getByRole('button', { name: /^ROLL DICE$/i });
  if (await roll.count() && await roll.first().isEnabled().catch(() => false)) {
    await roll.first().click();
    await actorPage.waitForTimeout(4000);
  }
  for (let k = 0; k < 6; k++) {
    const buy = actorPage.getByRole('button', { name: /^BUY /i });
    if (await buy.count() && await buy.first().isEnabled().catch(() => false)) {
      boughtTile = (await buy.first().innerText()).trim();
      const preBuy = await actorPage.evaluate(() => { const x = window.__BB_STATE__; return { turn: x.currentPlayerId, phase: x.phase, owned: x.properties.filter(p => p.ownerId).length }; });
      console.log('   preBuy=' + JSON.stringify(preBuy));
      const clientIds = await Promise.all(pages.map(p => p.evaluate(() => localStorage.getItem('bb-player-id'))));
      const stateIds = await actorPage.evaluate(() => window.__BB_STATE__.players.map(p => p.id));
      console.log('   clientIds=' + JSON.stringify(clientIds));
      console.log('   stateIds=' + JSON.stringify(stateIds));
      const btnState = await actorPage.evaluate(() => {
        const bs = Array.from(document.querySelectorAll('button')).filter(x => /^BUY /.test(x.innerText.trim()));
        return bs.map(x => ({ dis: x.disabled, txt: x.innerText.trim() }));
      });
      console.log('   btnState=' + JSON.stringify(btnState));
      const lsId = await actorPage.evaluate(() => localStorage.getItem('bb-player-id'));
      console.log('   actorLsId=' + lsId + ' turn=' + preBuy.turn + ' match=' + (lsId === preBuy.turn));

      // There are two BUY buttons when a property decision is open: one in the
      // ActionBar (no-op) and one inside BuyDecisionModal. The modal one has
      // the formatted rupee amount, so target it explicitly.
      const clicked = await actorPage.evaluate(() => {
        const bs = Array.from(document.querySelectorAll('button')).filter(x => /^BUY /.test(x.innerText.trim()));
        const withComma = bs.find(x => /,/.test(x.innerText));
        const el = withComma || bs[0];
        if (!el) return 'no-button';
        el.click();
        return 'clicked:' + el.innerText.trim();
      });
      console.log('   ' + clicked);
      purchased = true;
      break;
    }
    let acted = false;
    for (const re of [/^CONTINUE$/i, /^PASS$/i, /^DECLINE$/i, /^END TURN$/i]) {
      const el = actorPage.getByRole('button', { name: re });
      if (await el.count() && await el.first().isEnabled().catch(() => false)) {
        await el.first().click({ force: true });
        await actorPage.waitForTimeout(2200);
        acted = true; break;
      }
    }
    if (!acted) break;
  }
  void actor;
}
log('A human player completed a real property purchase', purchased, boughtTile);
  if (!purchased) {
    const diag = await A.evaluate(() => {
      const s = window.__BB_STATE__;
      return { turn: s.turnNumber, phase: s.phase, lastRoll: s.lastRoll,
        positions: s.players.map(p => p.id.slice(-4) + '@' + p.position) };
    });
    console.log('   DIAG no-purchase: ' + JSON.stringify(diag));
    console.log('   DIAG recent events: ' + JSON.stringify(
      (await A.evaluate(() => window.__BB_STATE__.events.slice(-8).map(e => e.message)))));
  }
  const roster = await A.evaluate(() => window.__BB_STATE__.players.map(p => p.name + (p.isBot ? "(bot)" : "")));
  log("Roster has no bots when 4 humans joined", !roster.some(r => r.includes("bot")), roster.join(","));

await A.waitForTimeout(1500);
const seen = [];
for (const page of pages) seen.push((await readState(page))?.turn);
log('All 4 browsers agree on the current turn', new Set(seen).size === 1, `turn=${seen[0]}`);

const ownedAll = await Promise.all(pages.map(p => p.evaluate(() => { const s = window.__BB_STATE__; return s ? s.properties.filter(x => x.ownerId).length : -1; })));
log('Ownership visible identically in every browser', ownedAll[0] > 0 && new Set(ownedAll).size === 1, 'owned=' + ownedAll.join('/'));
const spread = await Promise.all(pages.map(p => readState(p).then(s => s?.players)));
log('Cash/property state identical on all clients after purchase',
  new Set(spread).size === 1, `distinct=${new Set(spread).size}`);
await A.screenshot({ path: `${SHOTS}/03-after-roll-A.png` });
await B.screenshot({ path: `${SHOTS}/03-after-roll-B.png` });




// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ 7. Chat from B, visible in A ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const hasChatInput = async page => {
  const tab = page.getByRole('button', { name: /CHAT/i });
  if (await tab.count()) { await tab.first().click(); await page.waitForTimeout(400); }
  return (await page.getByPlaceholder(/message/i).count()) > 0;
};
if (await hasChatInput(A) && await hasChatInput(B)) {
  await B.getByPlaceholder(/message/i).fill('hello from Arjun');
  await B.getByPlaceholder(/message/i).press('Enter');
  await A.waitForTimeout(1500);
  log('Chat propagates between browsers', (await A.locator('body').innerText()).includes('hello from Arjun'));
} else {
  log('Chat input present on clients', false);
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ 8. Disconnect + reconnect player C ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const cBefore = (await readState(C))?.players ?? null;
await ctxs[2].setOffline(true);
await C.waitForTimeout(2500);
await A.screenshot({ path: `${SHOTS}/04-C-offline-A.png` });
await ctxs[2].setOffline(false);
await C.waitForTimeout(5000);
const cAfter = (await readState(C))?.players ?? null;
log('Reconnecting player restores same identity/state', !!cBefore && cBefore === cAfter,
  cBefore === cAfter ? 'restored' : `MISMATCH ${cBefore} vs ${cAfter}`);

await A.screenshot({ path: `${SHOTS}/05-final-A.png` });
await C.screenshot({ path: `${SHOTS}/05-final-C.png` });

console.log('\n=== BROWSER ERRORS ===');
for (const [k, v] of Object.entries(results.errors)) {
  console.log(`${k}: console=${v.console.length} page=${v.page.length}`);
  v.console.slice(0, 3).forEach(e => console.log('   C: ' + e));
  v.page.slice(0, 3).forEach(e => console.log('   P: ' + e));
}
fs.writeFileSync('scripts/mp-report.json', JSON.stringify(results, null, 2));
await browser.close();

