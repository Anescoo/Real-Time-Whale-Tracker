import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketService } from "./services/websocket.service";
import { NetworkManagerService } from "./services/network-manager.service";
import { DatabaseService } from "./services/database.service";
import { CacheService } from "./services/cache.service";
import { NETWORKS_LIST } from "./config/networks";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Initialize services
const dbService = new DatabaseService();
const cacheService = new CacheService();
const wsService = new WebSocketService(server);
const networkManager = new NetworkManagerService(wsService, dbService, cacheService);

// Wire NetworkManager into WebSocketService (avoids circular dependency at construction)
wsService.setNetworkManager(networkManager);

// Routes
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "🐋 Whale Tracker Backend is running!",
    activeNetworks: networkManager.getActiveNetworks(),
  });
});

// List all available networks (for frontend dropdown)
app.get("/api/networks", (_req, res) => {
  res.json(NETWORKS_LIST);
});

// Get recent whale transactions for a given network
app.get("/api/whales/recent", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const network = (req.query.network as string) || "eth-mainnet";

  // 1. Try Redis cache (fastest)
  const cached = await cacheService.getRecentTransactions(network);
  if (cached.length > 0) {
    res.json(cached.slice(0, limit));
    return;
  }

  // 2. Try PostgreSQL
  const fromDb = await dbService.getRecentTransactions(limit, network);
  if (fromDb.length > 0) {
    res.json(fromDb);
    return;
  }

  // 3. Fallback: in-memory from running monitor
  const monitor = networkManager.getMonitor(network);
  res.json(monitor ? monitor.getRecentTransactions(limit) : []);
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);

  // Connect persistence layer
  try {
    await dbService.connect();
  } catch (e) {
    console.warn("⚠️  PostgreSQL unavailable — running without persistence:", (e as Error).message);
  }

  try {
    await cacheService.connect();
    // Seed ETH mainnet cache from DB on startup
    const recent = await dbService.getRecentTransactions(100, "eth-mainnet");
    await cacheService.seed(recent, "eth-mainnet");
  } catch (e) {
    console.warn("⚠️  Redis unavailable — running without cache:", (e as Error).message);
  }

  // Start default network (ETH mainnet)
  try {
    await networkManager.startAll();
  } catch (error) {
    console.error("❌ Failed to start network manager:", error);
  }
});
