const http = require('http');

console.log('Testing Nyaya API on http://localhost:3001/api/disputes...');

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/disputes',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
}, res => {
  let body = '';
  res.on('data', chunk => {
    body += chunk;
  });
  res.on('end', () => {
    console.log("RESPONSE HTTP STATUS:", res.statusCode);
    const json = JSON.parse(body);
    console.log(`Disputes count: ${json.disputes?.length}, Mode: ${json.mode}`);
  });
});

req.on('error', e => {
  console.error('Request error:', e.message);
});

req.end();
