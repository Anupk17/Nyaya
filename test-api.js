const http = require('http');

const data = JSON.stringify({
  customer_name: "Customer",
  merchant_name: "Retail Marketplace Partner",
  product_name: "Disputed Item",
  amount: 2499,
  customer_claim: "I ordered boAt Airdopes 141 wireless earbuds worth 2499 from QuickMart Electronics on Nyaya. Order ID: PTM-88213. The delivery app shows delivered yesterday at 3pm but I was home all day and nobody rang the bell. There is NO OTP confirmation in my messages. I never received any package. I have my original Nyaya invoice showing 2499 paid. I filed this complaint within 3 hours of the supposed delivery. Please analyze my dispute.",
  merchant_claim: "Fulfillment dispatched per standard catalog specification.",
  proof_attachments: [],
  chat_log: [],
  use_bedrock: false
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/custom-dispute/resolve',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', chunk => {
    body += chunk;
  });
  res.on('end', () => {
    console.log("RESPONSE BODY:");
    console.log(body);
  });
});

req.on('error', e => {
  console.error(e);
});

req.write(data);
req.end();
