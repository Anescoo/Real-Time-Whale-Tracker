import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  valueEth: number;
  valueUsd?: number;
  timestamp: number;
}

export class WebSocketService {
  private io: Server;
  private connectedClients: Set<string> = new Set();

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupEventHandlers();
    console.log('✅ WebSocket service initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);

      // Envoyer le nombre de clients connectés à tous
      this.broadcastClientsCount();

      // Test ping/pong
      socket.on('ping', () => {
        console.log(`🏓 Ping received from ${socket.id}`);
        socket.emit('pong', { 
          timestamp: Date.now(),
          message: 'Pong from server!'
        });
      });

      // Gestion de la déconnexion
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
        this.broadcastClientsCount();
      });
    });
  }

  private broadcastClientsCount() {
    const count = this.connectedClients.size;
    this.io.emit('clients:count', count);
    console.log(`👥 Connected clients: ${count}`);
  }

  public broadcastWhaleTransaction(transaction: Transaction) {
    console.log(`🐋 Broadcasting whale transaction: ${transaction.hash}`);
    this.io.emit('whale:transaction', transaction);
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
