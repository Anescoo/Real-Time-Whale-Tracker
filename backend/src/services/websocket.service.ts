import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { NetworkManagerService } from './network-manager.service';

export class WebSocketService {
  private io: Server;
  private connectedClients: Set<string> = new Set();
  private lastStats: Map<string, Record<string, unknown>> = new Map();
  private lastPrices: Map<string, number> = new Map();
  private networkManager?: NetworkManagerService;

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

  /** Inject NetworkManager after construction to avoid circular dependency */
  setNetworkManager(nm: NetworkManagerService): void {
    this.networkManager = nm;
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);

      // Auto-join default network room
      socket.join('network:eth-mainnet');

      const ethStats = this.lastStats.get('eth-mainnet');
      if (ethStats) socket.emit('initial:stats', ethStats);
      const ethPrice = this.lastPrices.get('eth-mainnet');
      if (ethPrice && ethPrice > 0) socket.emit('eth:price', ethPrice);

      this.broadcastClientsCount();

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('join:network', async ({ network }: { network: string }) => {
        // Leave all current network rooms
        for (const room of Array.from(socket.rooms)) {
          if (room !== socket.id && room.startsWith('network:')) {
            const oldNetwork = room.replace('network:', '');
            socket.leave(room);
            this.networkManager?.handleLeave(socket.id, oldNetwork);
          }
        }
        // Join new room
        socket.join(`network:${network}`);
        await this.networkManager?.handleJoin(socket.id, network);

        // Send last known stats + price for this network
        const netStats = this.lastStats.get(network);
        if (netStats) socket.emit('initial:stats', netStats);
        const price = this.lastPrices.get(network);
        if (price && price > 0) socket.emit('eth:price', price);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        // Leave all network rooms
        for (const room of Array.from(socket.rooms)) {
          if (room !== socket.id && room.startsWith('network:')) {
            this.networkManager?.handleLeave(socket.id, room.replace('network:', ''));
          }
        }
        this.connectedClients.delete(socket.id);
        this.broadcastClientsCount();
      });
    });
  }

  private broadcastClientsCount(): void {
    this.io.emit('clients:count', this.connectedClients.size);
  }

  /** Broadcast to a specific network room */
  public broadcastToNetwork(event: string, data: unknown, networkId: string): void {
    if (event === 'stats:update') this.lastStats.set(networkId, data as Record<string, unknown>);
    if (event === 'eth:price') this.lastPrices.set(networkId, data as number);
    this.io.to(`network:${networkId}`).emit(event, data);
  }

  public broadcastWhaleTransaction(transaction: unknown): void {
    this.io.to('network:eth-mainnet').emit('whale:transaction', transaction);
  }

  public broadcastEthPrice(price: number): void {
    this.lastPrices.set('eth-mainnet', price);
    this.io.to('network:eth-mainnet').emit('eth:price', price);
  }

  public broadcastStats(stats: unknown): void {
    this.lastStats.set('eth-mainnet', stats as Record<string, unknown>);
    this.io.to('network:eth-mainnet').emit('stats:update', stats);
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
