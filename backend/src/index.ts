import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketService } from './services/websocket.service';

// Charger les variables d'environnement AVANT tout
dotenv.config();

console.log('🔧 Environment loaded:', {
  PORT: process.env.PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  NODE_ENV: process.env.NODE_ENV
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Créer le serveur HTTP
const httpServer = http.createServer(app);

// Initialiser WebSocket
const wsService = new WebSocketService(httpServer);

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    websocket: {
      connectedClients: wsService.getConnectedClientsCount()
    }
  });
});

// Route de test pour déclencher une whale transaction
app.get('/api/test-whale', (req, res) => {
  const testTransaction = {
    hash: `0x${Math.random().toString(16).substring(2, 66)}`,
    blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
    from: `0x${Math.random().toString(16).substring(2, 42)}`,
    to: `0x${Math.random().toString(16).substring(2, 42)}`,
    valueEth: Math.random() * 1000 + 100,
    valueUsd: (Math.random() * 1000 + 100) * 2500,
    timestamp: Date.now()
  };

  wsService.broadcastWhaleTransaction(testTransaction);

  res.json({
    success: true,
    message: 'Test whale transaction broadcasted',
    transaction: testTransaction
  });
});

// Démarrer le serveur
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`🌍 CORS enabled for: ${process.env.CORS_ORIGIN}`);
});
