const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel:'chrome', args:['--no-sandbox'] });
  const p = await b.newPage();
  await p.goto('http://localhost:3010/game', { waitUntil:'networkidle' });
  await p.waitForSelector('.bb-header');
  const r = await p.evaluate(() => {
    for (const s of document.styleSheets) {
      let txt=''; try { txt = Array.from(s.cssRules).map(r=>r.cssText).join('\n'); } catch {}
      const i = txt.indexOf('bb-header');
      if (i >= 0) return txt.slice(Math.max(0,i-260), i+220);
    }
    return 'not found';
  });
  console.log(r);
  await b.close();
})();
