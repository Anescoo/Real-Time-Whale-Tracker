import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  valueEth: number;
  valueUsd: number;
  timestamp: number;
}

export class WebSocketService {
  private io: Server;
  private connectedClients: Set<string> = new Set();
  private lastStats: any = null;
  private lastEthPrice: number = 0;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupEventHandlers();
    console.log('✅ WebSocket service initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);

      if (this.lastStats) socket.emit('initial:stats', this.lastStats);
      if (this.lastEthPrice > 0) socket.emit('eth:price', this.lastEthPrice);

      this.broadcastClientsCount();

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
        this.broadcastClientsCount();
      });
    });
  }

  private broadcastClientsCount() {
    this.io.emit('clients:count', this.connectedClients.size);
  }

  public broadcastWhaleTransaction(transaction: Transaction) {
    this.io.emit('whale:transaction', transaction);
  }

  public broadcastEthPrice(price: number) {
    this.lastEthPrice = price;
    this.io.emit('eth:price', price);
  }

  public broadcastStats(stats: any) {
    this.lastStats = stats;
    this.io.emit('stats:update', stats);
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
