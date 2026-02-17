import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketService } from "./services/websocket.service";
import { EthereumService } from "./services/ethereum.service";

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
