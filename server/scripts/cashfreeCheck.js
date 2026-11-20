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

const clientId = process.env.CASHFREE_CLIENT_ID || '';
const clientSecret = process.env.CASHFREE_CLIENT_SECRET || '';
const apiVersion = process.env.CASHFREE_API_VERSION || '2025-01-01';

// Check keys
const missing = [];
if (!clientId.trim()) missing.push('CASHFREE_CLIENT_ID');
if (!clientSecret.trim()) missing.push('CASHFREE_CLIENT_SECRET');

if (missing.length > 0) {
  console.log(`KEYS MISSING: ${missing.join(', ')}`);
  process.exit(0);
}

// Masking helper
function maskSecrets(text) {
  if (!text || typeof text !== 'string') return text;
  let masked = text;
  if (clientId && clientId.length > 4) {
    masked = masked.replaceAll(clientId, clientId.slice(0, 4) + '****');
  }
  if (clientSecret && clientSecret.length > 4) {
    masked = masked.replaceAll(clientSecret, clientSecret.slice(0, 4) + '****');
  }
  return masked;
}

async function checkCashfree() {
  const url = 'https://sandbox.cashfree.com/pg/orders/TEST_ORDER_1/disputes';

  try {
    let res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': apiVersion
      }
    });

    let status = res.status;
    let rawText = await res.text();

    // If disputes subresource returned 500 internal error due to missing order parent, check orders/TEST_ORDER_1
    if (status === 500) {
      const orderCheckRes = await fetch('https://sandbox.cashfree.com/pg/orders/TEST_ORDER_1', {
        method: 'GET',
        headers: {
          'x-client-id': clientId,
          'x-client-secret': clientSecret,
          'x-api-version': apiVersion
        }
      });
      if (orderCheckRes.status !== 500) {
        res = orderCheckRes;
        status = res.status;
        rawText = await res.text();
      }
    }

    let bodySnippet = maskSecrets(rawText).slice(0, 500);

    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (_) {}

    console.log(`HTTP Status: ${status}`);
    console.log(`Response Body: ${bodySnippet}`);

    // Map verdict
    const lowerBody = (rawText || '').toLowerCase();
    const isVersionError = lowerBody.includes('version') || lowerBody.includes('x-api-version');

    if (isVersionError && (status === 400 || status === 404 || status === 422)) {
      console.log("Verdict: VERSION_ERROR: check the current x-api-version in Cashfree's docs");
    } else if (status === 401 || lowerBody.includes('authentication') || lowerBody.includes('unauthorized') || lowerBody.includes('invalid credentials')) {
      console.log("Verdict: AUTH_FAILED: keys wrong, or production keys used on the sandbox URL");
    } else if (status === 404 || lowerBody.includes('order not found') || lowerBody.includes('order_not_found') || (parsed && parsed.message && parsed.message.toLowerCase().includes('order'))) {
      console.log("Verdict: AUTH_OK: keys work (order simply does not exist)");
    } else if (status === 200) {
      if (Array.isArray(parsed) && parsed.length === 0) {
        console.log("Verdict: AUTH_OK: keys work, no disputes for this order");
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        const ids = parsed.map(d => d.dispute_id || d.id || 'unknown').join(', ');
        console.log(`Verdict: AUTH_OK: disputes returned (${ids})`);
      } else if (parsed && Array.isArray(parsed.disputes)) {
        if (parsed.disputes.length === 0) {
          console.log("Verdict: AUTH_OK: keys work, no disputes for this order");
        } else {
          const ids = parsed.disputes.map(d => d.dispute_id || d.id || 'unknown').join(', ');
          console.log(`Verdict: AUTH_OK: disputes returned (${ids})`);
        }
      } else {
        console.log("Verdict: AUTH_OK: keys work (received 200 OK)");
      }
    } else {
      console.log(`Verdict: UNEXPECTED_STATUS_${status}: ${bodySnippet}`);
    }
  } catch (err) {
    console.log(`Verdict: NETWORK_ERROR: ${err.message}`);
  }
}

checkCashfree();

