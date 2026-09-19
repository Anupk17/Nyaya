const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message, error.stack));
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  } catch(e) {
    console.error('Nav err:', e);
  }
  await browser.close();
})();
