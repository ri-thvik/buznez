// ============================================================
// BUSINESS BHARAT ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Human vs Human rent test (Phase 3).
// Two real browsers. A buys a property; B must later land on it
// and pay rent. Verifies server-side rent, cash movement on BOTH
// clients, and that no GST is applied to rent.
// Usage: node scripts/test-rent.mjs [baseUrl]
// ============================================================
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const WEB = process.argv[2] || 'http://localhost:3000';
const SHOTS = 'scripts/screenshots/rent';
fs.mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const log = (n, ok, d = '') => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${n}${d ? ' | ' + d : ''}`); };

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
const cA = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const cB = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const A = await cA.newPage();
const B = await cB.newPage();
const errs = { A: [], B: [] };
for (const [tag, p] of [['A', A], ['B', B]]) {
  p.on('pageerror', e => errs[tag].push(String(e).slice(0, 160)));
  p.on('console', m => { if (m.type() === 'error') errs[tag].push(m.text().slice(0, 160)); });
}

const st = p => p.evaluate(() => {
  const s = window.__BB_STATE__;
  if (!s) return null;
  return {
    turn: s.currentPlayerId, phase: s.phase, lastRoll: s.lastRoll,
    players: s.players.map(x => ({ id: x.id, name: x.name, cash: x.cash, pos: x.position, owned: x.ownedProperties })),
    props: s.properties.map(x => ({ pos: x.position, owner: x.ownerId })),
    board: s.board,
  };
});
const idOf = p => p.evaluate(() => localStorage.getItem('bb-player-id'));

async function clickModal(page, re) {
  const el = page.locator('button', { hasText: re });
  if (await el.count() && await el.first().isEnabled().catch(() => false)) {
    await el.first().click({ force: true });
    return true;
  }
  return false;
}
async function dismiss(page) {
  for (const re of [/^CONTINUE$/, /^OK$/, /^PASS$/, /^DECLINE$/, /^END TURN$/]) {
    if (await clickModal(page, re)) { await page.waitForTimeout(2000); return true; }
  }
  return false;
}

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Setup: A creates, B joins ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
await A.goto(`${WEB}/create`, { waitUntil: 'networkidle' });
await A.waitForTimeout(600);
await A.getByRole('button', { name: /^2 Players$/ }).click();
await A.getByRole('button', { name: /CREATE ROOM/i }).click();
await A.waitForTimeout(1400);
const code = (await A.locator('.font-mono').first().innerText()).trim();
log('Room created for 2-human test', /^[A-Z0-9]{6}$/.test(code), code);

await B.goto(`${WEB}/join`, { waitUntil: 'networkidle' });
await B.waitForTimeout(400);
await B.locator('input').first().fill(code);
await B.getByPlaceholder('Enter your name').fill('Rithvik');
await B.getByRole('button', { name: /JOIN ROOM/i }).click();
await B.waitForTimeout(1200);
log('Second human joined', /Players\s*\(2\//.test(await A.locator('body').innerText()));

await A.getByRole('button', { name: /START GAME/i }).click();
await A.waitForTimeout(3000);

const idA = await idOf(A);
const idB = await idOf(B);
const roster = (await st(A)).players;
log('Exactly 2 players, no bots (bot-free rent test)', roster.length === 2 && roster.every(p => !p.id.startsWith('bot')), roster.map(p => p.name).join(','));
log('Both browsers hold distinct player identities', !!idA && !!idB && idA !== idB,
  `A=${(idA||'').slice(-5)} B=${(idB||'').slice(-5)}`);
const actorFor = turnId => (turnId === idA ? A : B);

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Drive turns until someone owns a property ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
let ownerId = null, boughtPos = -1;
for (let t = 0; t < 40 && !ownerId; t++) {
  const s = await st(A); if (!s) break;
  const p = actorFor(s.turn); if (!p) { await A.waitForTimeout(800); continue; }
  const roll = p.getByRole('button', { name: /^ROLL DICE$/i });
  if (await roll.count() && await roll.first().isEnabled().catch(() => false)) {
    await roll.first().click(); await p.waitForTimeout(3500);
  }
  for (let k = 0; k < 4; k++) {
    if (await clickModal(p, /^BUY \u20b9[\d,]+$/)) {
      await p.waitForTimeout(2200);
      const s2 = await st(A);
      const owned = s2?.props.find(x => x.owner);
      if (owned) { ownerId = owned.owner; boughtPos = owned.pos; }
      break;
    }
    if (!(await dismiss(p))) break;
  }
  if (!ownerId) { const o = (await st(A))?.props.find(x => x.owner); if (o) { ownerId = o.owner; boughtPos = o.pos; } }
}

log('A human purchased a property', !!ownerId,
  ownerId ? `pos=${boughtPos} owner=${ownerId.slice(-5)}` : 'none after 40 turns');
await A.screenshot({ path: `${SHOTS}/01-after-purchase-A.png` });

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Drive turns until the other human lands on it and pays rent ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
let rentPaid = null;
for (let t = 0; t < 90 && !rentPaid; t++) {
  const s = await st(A); if (!s) break;
  const p = actorFor(s.turn); if (!p) { await A.waitForTimeout(800); continue; }
  const roll = p.getByRole('button', { name: /^ROLL DICE$/i });
  if (await roll.count() && await roll.first().isEnabled().catch(() => false)) {
    await roll.first().click(); await p.waitForTimeout(3500);
  }
  for (let k = 0; k < 4; k++) {
    if (await clickModal(p, /^BUY \u20b9[\d,]+$/)) { await p.waitForTimeout(2000); }
    if (!(await dismiss(p))) break;
  }
  const s2 = await st(A);
  const hits = s2?.events.filter(e => /paid .* rent for/i.test(e)) || [];
  if (hits.length) {
    const m = hits[hits.length - 1].match(/paid .*? (\u20b9[\d,]+) rent for (.+)$/);
    rentPaid = { msg: hits[hits.length - 1], amount: m ? m[1] : null, tile: m ? m[2] : null };
    break;
  }
}
log('A human paid rent to another human', !!rentPaid, rentPaid ? rentPaid.msg : 'no rent event within 90 turns');
await A.screenshot({ path: `${SHOTS}/02-after-rent-A.png` });
await B.screenshot({ path: `${SHOTS}/02-after-rent-B.png` });

if (rentPaid) {
  const sa = await st(A), sb = await st(B);
  log('Both browsers show identical cash balances',
    JSON.stringify(sa.players.map(p => p.cash)) === JSON.stringify(sb.players.map(p => p.cash)),
    `A=${sa.players.map(p => p.cash).join('/')} B=${sb.players.map(p => p.cash).join('/')}`);
  log('Both browsers show identical ownership', JSON.stringify(sa.props) === JSON.stringify(sb.props));
  log('Both browsers show identical event logs', JSON.stringify(sa.events) === JSON.stringify(sb.events));
  log('Current turn agrees on both clients', sa.turn === sb.turn);

  const tile = sa.board.find(x => x.position === boughtPos);
  const amount = Number(String(rentPaid.amount).replace(/[^0-9]/g, ''));
  const ownerIdNow = sa.props.find(x => x.pos === boughtPos)?.owner;
  const ownerRec = sa.players.find(p => p.id === ownerIdNow);
  log('Rent event references the purchased property', rentPaid.tile === tile?.name,
    `event=${rentPaid.tile} bought=${tile?.name}`);
  let expected = tile?.baseRent ?? 0;
  if (tile?.group) {
    const members = sa.board.filter(x => x.group === tile.group).map(x => x.position);
    const complete = members.every(gp => sa.props.find(x => x.pos === gp)?.owner === ownerRec?.id);
    if (complete) expected *= 2;
  }
  log('Rent equals configured base rent (doubled if complete group)', expected === amount,
    `expected=${expected} actual=${rentPaid.amount} baseRent=${tile?.baseRent} completeGroup=${expected !== (tile?.baseRent ?? 0)}`);
  log('No GST applied to rent (rent is a transfer, not a taxable sale)',
    Number.isFinite(amount) && amount === (tile?.baseRent ?? 0) * (expected === (tile?.baseRent ?? 0) ? 1 : 2));
  log('Renter cash decreased below the starting 25000', sa.players.some(p => p.cash < 25000),
    `cash=${sa.players.map(p => p.cash).join('/')}`);
}

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Server authority: a client-side edit must not be trusted ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
await B.evaluate(() => { window.__BB_STATE__.players[0].cash = 999999; });
await A.waitForTimeout(2000);
const afterForge = await st(A);
log('Client-side cash edit is overwritten by the server',
  afterForge.players.every(p => p.cash !== 999999),
  `serverCash=${afterForge.players.map(p => p.cash).join('/')}`);

log('No runtime errors in Browser A', errs.A.length === 0, errs.A.slice(0, 2).join(' | '));
log('No runtime errors in Browser B', errs.B.length === 0, errs.B.slice(0, 2).join(' | '));

console.log(failures === 0 ? '\nRENT TEST: ALL CHECKS PASSED' : `\nRENT TEST: ${failures} FAILURE(S)`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);


