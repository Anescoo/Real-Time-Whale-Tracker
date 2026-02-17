import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketService } from "./services/websocket.service";
import { EthereumService } from "./services/ethereum.service";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Initialize services
const wsService = new WebSocketService(server);
const ethService = new EthereumService(wsService);

// Routes
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "🐋 Whale Tracker Backend is running!",
    websocket: {
      connectedClients: wsService.getConnectedClientsCount(),
    },
    ethereum: ethService.getStats(),
  });
});

// Test endpoint to trigger fake whale
app.get("/api/test-whale", (req, res) => {
  const fakeTransaction = {
    hash: `0x${Math.random().toString(16).substring(2, 66)}`,
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    to: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
    value: "1500000000000000000000", // 1500 ETH
    valueEth: 1500,
    valueUsd: 1500 * 2500,
    blockNumber: 12345678,
    timestamp: Date.now(),
  };

  wsService.broadcastWhaleTransaction(fakeTransaction);

  res.json({
    success: true,
    message: "Fake whale transaction broadcasted",
    transaction: fakeTransaction,
  });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);

  // Start Ethereum monitoring
  try {
    // Test Alchemy connection
    console.log("🧪 Testing Alchemy connection...");
    const testBlock = await ethService["alchemy"].core.getBlockNumber();
    console.log(`✅ Alchemy works! Latest block: ${testBlock}`);
    await ethService.start();
  } catch (error) {
    console.error("❌ Failed to start Ethereum service:", error);
  }
});
