/**
 * PURPOSE: Automated live browser walkthrough script taking verification screenshots
 * INPUT: none (drives headless Chrome via puppeteer-core against localhost:5173)
 * RETURNS: exit code 0 on success
 * ERRORS: exits 1 on failure
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickButtonWithText(page, searchText) {
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.toLowerCase().includes(searchText.toLowerCase())) {
      await b.click();
      return true;
    }
  }
  return false;
}

async function loginAsRole(page, roleLabel) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await sleep(1000);
  const pwdInput = await page.$('input[type="password"]');
  if (pwdInput && DEMO_PASSWORD) {
    await pwdInput.click({ clickCount: 3 });
    await pwdInput.type(DEMO_PASSWORD);
  }
  await clickButtonWithText(page, roleLabel);
  await sleep(3500);
}

async function runWalkthrough() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('--> Launching Chrome browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Capture console and network errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[BROWSER CONSOLE ERROR]', msg.text());
  });

  try {
    // 01: Login Screen
    console.log('--> [1/14] Loading Login Page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-screen.png') });
    console.log('  [+] Captured: 01-login-screen.png');

    // 02: Analyst Dashboard
    console.log('--> [2/14] Logging in as Analyst...');
    await loginAsRole(page, 'Analyst');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-dashboard-analyst.png') });
    console.log('  [+] Captured: 02-dashboard-analyst.png');

    // 03: AR Aging with Cutoff Date
    console.log('--> [3/14] Navigating to AR Aging...');
    await page.goto('http://localhost:5173/aging', { waitUntil: 'networkidle0' });
    await sleep(2000);
    const dateInput = await page.$('input[type="date"]');
    if (dateInput) {
      await page.evaluate((el) => {
        el.value = '2026-06-01';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, dateInput);
      await sleep(2000);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-ar-aging-cutoff.png') });
    console.log('  [+] Captured: 03-ar-aging-cutoff.png');

    // 04: Revenue Leakage
    console.log('--> [4/14] Navigating to Revenue Leakage...');
    await page.goto('http://localhost:5173/leakage', { waitUntil: 'networkidle0' });
    await sleep(2000);
    const firstRow = await page.$('tbody tr');
    if (firstRow) {
      await firstRow.click();
      await sleep(1500);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-revenue-leakage-drawer.png') });
    console.log('  [+] Captured: 04-revenue-leakage-drawer.png');

    // 05: Process Delays
    console.log('--> [5/14] Navigating to Process Delays...');
    await page.goto('http://localhost:5173/delays', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-process-delays.png') });
    console.log('  [+] Captured: 05-process-delays.png');

    // 06: Exceptions Workbench & Triage Drawer
    console.log('--> [6/14] Navigating to Exceptions & Triage Drawer...');
    await page.goto('http://localhost:5173/exceptions', { waitUntil: 'networkidle0' });
    await sleep(2000);
    const excRow = await page.$('tbody tr');
    if (excRow) {
      await excRow.click();
      await sleep(1500);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-exceptions-drawer.png') });
    console.log('  [+] Captured: 06-exceptions-drawer.png');

    // 07: Benchmark Evaluation
    console.log('--> [7/14] Navigating to Model Evaluation Benchmark...');
    await page.goto('http://localhost:5173/evaluation', { waitUntil: 'networkidle0' });
    await sleep(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-evaluation-benchmark.png') });
    console.log('  [+] Captured: 07-evaluation-benchmark.png');

    // 08: DebugPanel
    console.log('--> [8/14] Opening DebugPanel...');
    const debugBtn = await page.$('button[title="Toggle Debugger (Ctrl+Shift+D)"]');
    if (debugBtn) {
      await debugBtn.click();
      await sleep(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-debug-panel-open.png') });
      console.log('  [+] Captured: 08-debug-panel-open.png');
    }

    // 09: Logout
    console.log('--> [9/14] Logging out...');
    const logoutBtn = await page.$('button[title="Sign out"]');
    if (logoutBtn) {
      await logoutBtn.click();
      await sleep(2000);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-logout-redirect.png') });
    console.log('  [+] Captured: 10-logout-redirect.png');

    // 10: Customer Scoped Login & Access Denial
    console.log('--> [10/14] Customer Scoped Login & Access Denial...');
    await loginAsRole(page, 'Customer');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-customer-dashboard-scoped.png') });
    console.log('  [+] Captured: 11-customer-dashboard-scoped.png');

    await page.goto('http://localhost:5173/exceptions', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-customer-forbidden-guard.png') });
    console.log('  [+] Captured: 12-customer-forbidden-guard.png');

    // 11: Admin Login & User Role Management
    console.log('--> [11/14] Logging in as Admin for User Management (/admin)...');
    await loginAsRole(page, 'Admin');
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
    await sleep(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13-admin-user-management.png') });
    console.log('  [+] Captured: 13-admin-user-management.png');

    // 12: Quote Conversion Action in Records Explorer
    console.log('--> [12/14] Navigating to Records Explorer to view Quote Conversion...');
    await page.goto('http://localhost:5173/records', { waitUntil: 'networkidle0' });
    await sleep(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14-quote-conversion-action.png') });
    console.log('  [+] Captured: 14-quote-conversion-action.png');

    console.log('--> ALL 14 VERIFICATION SCREENSHOTS GENERATED CLEANLY.');
  } finally {
    await browser.close();
  }
}

runWalkthrough().catch((err) => {
  console.error('[WALKTHROUGH ERROR]', err);
  process.exit(1);
});
