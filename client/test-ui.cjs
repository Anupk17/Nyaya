const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    console.log('Filling input...');
    const inputSelector = 'input[placeholder="Describe your dispute or upload evidence..."]';
    await page.fill(inputSelector, 'I ordered boAt Airdopes 141 wireless earbuds worth ₹2,499 from QuickMart Electronics on Paytm. Order ID: PTM-88213. The delivery app shows delivered yesterday at 3pm but I was home all day and nobody rang the bell. There is NO OTP confirmation in my messages. I never received any package. I have my original Paytm invoice showing ₹2,499 paid. I filed this complaint within 3 hours of the supposed delivery. Please analyze my dispute.');
    
    console.log('Clicking Send...');
    await page.click('button[type="submit"]');

    console.log('Waiting for response...');
    // Wait for the "Run Resolution" button to be clickable
    const runBtn = page.locator('button:has-text("Run Resolution")');
    await runBtn.waitFor({ state: 'visible' });
    
    console.log('Clicking Run Resolution...');
    await runBtn.click();

    console.log('Waiting for AI deliberation to complete...');
    // Wait until the verdict appears
    await page.waitForFunction(() => document.body.innerText.includes('Pending Human Approval'), { timeout: 60000 });
    
    console.log('Extracting data...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    console.log('\n--- PAGE TEXT START ---');
    console.log(bodyText);
    console.log('--- PAGE TEXT END ---\n');
    
  } catch(e) {
    console.error('Test error:', e);
  } finally {
    await browser.close();
  }
})();
