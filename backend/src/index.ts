// ✅ IMPORTANT : Charger dotenv EN PREMIER
import dotenv from 'dotenv';
dotenv.config();

// Ensuite seulement, importer les autres modules
import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketService } from "./services/websocket.service";
import { EthereumService } from "./services/ethereum.service";
import { createApiRoutes } from "./routes/api.routes";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// ✅ Vérifier que les variables d'environnement sont chargées
console.log('🔑 Environment variables loaded:');
console.log(`   - ALCHEMY_API_KEY: ${process.env.ALCHEMY_API_KEY ? '✅ Present' : '❌ Missing'}`);
console.log(`   - PORT: ${process.env.PORT || '3000'}`);
console.log(`   - WHALE_THRESHOLD_ETH: ${process.env.WHALE_THRESHOLD_ETH || '100'}`);

// Initialize services
const wsService = new WebSocketService(server);
const ethService = new EthereumService(wsService);

// ✅ Routes API
app.use('/api', createApiRoutes(ethService));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "🐋 Whale Tracker Backend is running!",
    ethereum: ethService.getStats(),
  });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Start Ethereum monitoring
  await ethService.start();
});
