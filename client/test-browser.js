import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
  page.on('requestfailed', request =>
    console.error('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText)
  );

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  } catch (err) {
    console.error('Navigation error:', err);
  }

  await browser.close();
})();
