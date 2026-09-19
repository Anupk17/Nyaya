const path = require('path');
require('dotenv').config(); // Load local .env
try { require('dotenv').config({ path: path.join(__dirname, '../.env') }); } catch (e) { /* parent .env not required */ }
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 'http://localhost:5174',
    'http://127.0.0.1:5173', 'http://127.0.0.1:5174',
    'https://nyaya-c8c0a.web.app',
    'https://nyaya-c8c0a.firebaseapp.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  ⚖️  Nyaya Server running on http://localhost:${PORT}`);
  console.log(`  📡 API available at http://localhost:${PORT}/api`);
  console.log(`  🔑 Groq API Keys Status:`);
  console.log(`     - Shared Key:   ${process.env.GROQ_API_KEY ? '✓ active' : '✗ not set'}`);
  console.log(`     - Evidence Key: ${process.env.GROQ_API_KEY_EVIDENCE ? '✓ custom key' : (process.env.GROQ_API_KEY ? '✓ fallback to shared' : '✗ missing')}`);
  console.log(`     - Merchant Key: ${process.env.GROQ_API_KEY_MERCHANT ? '✓ custom key' : (process.env.GROQ_API_KEY ? '✓ fallback to shared' : '✗ missing')}`);
  console.log(`     - Customer Key: ${process.env.GROQ_API_KEY_CUSTOMER ? '✓ custom key' : (process.env.GROQ_API_KEY ? '✓ fallback to shared' : '✗ missing')}`);
  console.log(`     - Judge Key:    ${process.env.GROQ_API_KEY_JUDGE ? '✓ custom key' : (process.env.GROQ_API_KEY ? '✓ fallback to shared' : '✗ missing')}\n`);
});

