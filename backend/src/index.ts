// backend/src/index.ts
console.log('🚀 Starting backend...');

import express from 'express';
import cors from 'cors';

console.log('✅ Imports OK');

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`🔧 Port configured: ${PORT}`);

// ⚠️ IMPORTANT : CORS doit être AVANT les routes
app.use(cors({
  origin: 'http://localhost:5173',  // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

console.log('✅ CORS configured for http://localhost:5173');

app.use(express.json());

console.log('✅ Middlewares configured');

// Routes
app.get('/', (req, res) => {
  console.log('📥 GET /');
  res.json({ message: '🐋 Whale Tracker API' });
});

app.get('/health', (req, res) => {
  console.log('📥 GET /health');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: '🐋 Whale Tracker Backend is running!'
  });
});

console.log('✅ Routes configured');

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('=================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ CORS enabled for: http://localhost:5173`);
  console.log('=================================');
  console.log('');
});

console.log('🔄 Waiting for server to start...');
