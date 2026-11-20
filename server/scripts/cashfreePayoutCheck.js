const fs = require('fs');
const path = require('path');

// 1. Load server/.env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const payoutClientId = process.env.CASHFREE_PAYOUT_CLIENT_ID || '';
const payoutClientSecret = process.env.CASHFREE_PAYOUT_CLIENT_SECRET || '';

// Check keys
const missing = [];
if (!payoutClientId.trim()) missing.push('CASHFREE_PAYOUT_CLIENT_ID');
if (!payoutClientSecret.trim()) missing.push('CASHFREE_PAYOUT_CLIENT_SECRET');

if (missing.length > 0) {
  console.log(`KEYS MISSING: ${missing.join(', ')}`);
  process.exit(0);
}

// Mask secrets: show only first 4 characters
function maskSecrets(text) {
  if (!text || typeof text !== 'string') return text;
  let masked = text;
  if (payoutClientId && payoutClientId.length > 4) {
    masked = masked.replaceAll(payoutClientId, payoutClientId.slice(0, 4) + '****');
  }
  if (payoutClientSecret && payoutClientSecret.length > 4) {
    masked = masked.replaceAll(payoutClientSecret, payoutClientSecret.slice(0, 4) + '****');
  }
  return masked;
}

async function checkPayouts() {
  // Cashfree Payouts Test/Sandbox Authorize endpoint per official documentation
  const url = 'https://payout-gamma.cashfree.com/payout/v1/authorize';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Client-Id': payoutClientId,
        'X-Client-Secret': payoutClientSecret
      }
    });

    const status = res.status;
    const rawText = await res.text();
    const bodySnippet = maskSecrets(rawText).slice(0, 500);

    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (_) {}

    console.log(`HTTP Status: ${status}`);
    console.log(`Response Body: ${bodySnippet}`);

    // Map verdict
    const lowerBody = (rawText || '').toLowerCase();

    if (
      lowerBody.includes('ip not whitelisted') ||
      (parsed && parsed.subCode === '403') ||
      status === 403
    ) {
      console.log('Verdict: PAYOUT_IP_NOT_WHITELISTED');
    } else if (
      status === 200 &&
      parsed &&
      (parsed.status === 'SUCCESS' || parsed.subCode === '200') &&
      parsed.data &&
      parsed.data.token
    ) {
      console.log('Verdict: PAYOUT_AUTH_OK');
    } else if (
      status === 401 ||
      (parsed && parsed.subCode === '401') ||
      lowerBody.includes('invalid clientid') ||
      lowerBody.includes('authentication failed') ||
      lowerBody.includes('unauthorized')
    ) {
      console.log('Verdict: PAYOUT_AUTH_FAILED');
    } else {
      console.log(`Verdict: PAYOUT_AUTH_FAILED (${bodySnippet})`);
    }
  } catch (err) {
    console.log(`Verdict: NETWORK_ERROR (${err.message})`);
  }
}

checkPayouts();

