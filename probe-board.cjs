const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel:'chrome', args:['--no-sandbox'] });
  const p = await b.newPage();
  await p.goto('http://localhost:3010/game', { waitUntil:'networkidle' });
  await p.waitForSelector('.bb-board');
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    const board = document.querySelector('.bb-board');
    const bb = board.getBoundingClientRect();
    const cs = getComputedStyle(board);
    const tiles = Array.from(board.querySelectorAll('.bb-tile')).map(t => {
      const r = t.getBoundingClientRect();
      return { pos:+t.dataset.position, type:t.dataset.type,
        gx: t.style.gridColumn, gy: t.style.gridRow,
        x: Math.round(r.x-bb.x), y: Math.round(r.y-bb.y),
        w: Math.round(r.width), h: Math.round(r.height),
        text: (t.textContent||'').trim().slice(0,18) };
    });
    const byRow = {};
    tiles.forEach(t => { (byRow[t.gy] ||= []).push(t); });
    return { boardW: Math.round(bb.width), boardH: Math.round(bb.height),
      cornerVar: cs.getPropertyValue('--bb-corner'), edgeVar: cs.getPropertyValue('--bb-edge'),
      sizeVar: cs.getPropertyValue('--bb-board-size'),
      row1: byRow['1']||[], row11: (byRow['11']||[]).length };
  });
  console.log(JSON.stringify(r, null, 2));
  await b.close();
})();
