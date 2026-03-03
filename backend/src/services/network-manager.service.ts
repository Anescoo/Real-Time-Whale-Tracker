import { NETWORKS } from '../config/networks';
import { EvmMonitorService } from './evm-monitor.service';
import { BitcoinMonitorService } from './bitcoin-monitor.service';
import { WebSocketService } from './websocket.service';
import { DatabaseService } from './database.service';
import { CacheService } from './cache.service';

type AnyMonitor = EvmMonitorService | BitcoinMonitorService;

export class NetworkManagerService {
  private monitors: Map<string, AnyMonitor> = new Map();
  private roomCounts: Map<string, number> = new Map();
  private stopTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  /** Networks that failed to start due to a permanent error (e.g. API key 403). */
  private failedNetworks: Set<string> = new Set();

  constructor(
    private readonly wsService: WebSocketService,
    private readonly dbService?: DatabaseService,
    private readonly cacheService?: CacheService,
  ) {}

  /** Called at startup — ETH mainnet always running */
  async startAll(): Promise<void> {
    await this.startNetwork('eth-mainnet');
  }

  /** A socket has joined a network room */
  async handleJoin(socketId: string, networkId: string): Promise<void> {
    // Cancel any pending stop timer for this network
    const timer = this.stopTimers.get(networkId);
    if (timer) {
      clearTimeout(timer);
      this.stopTimers.delete(networkId);
    }

    const prev = this.roomCounts.get(networkId) ?? 0;
    this.roomCounts.set(networkId, prev + 1);

    if (!this.monitors.has(networkId) && !this.failedNetworks.has(networkId)) {
      await this.startNetwork(networkId);
    }
  }

  /** A socket has left a network room */
  handleLeave(socketId: string, networkId: string): void {
    const count = Math.max(0, (this.roomCounts.get(networkId) ?? 0) - 1);
    this.roomCounts.set(networkId, count);

    // ETH mainnet never stops
    if (networkId === 'eth-mainnet') return;

    if (count === 0) {
      const timer = setTimeout(() => {
        if ((this.roomCounts.get(networkId) ?? 0) === 0) {
          this.stopNetwork(networkId);
        }
        this.stopTimers.delete(networkId);
      }, 2 * 60 * 1000); // 2 min grace period
      this.stopTimers.set(networkId, timer);
    }
  }

  private async startNetwork(networkId: string): Promise<void> {
    if (this.monitors.has(networkId)) return;

    const config = NETWORKS[networkId];
    if (!config || config.provider === 'coming_soon') {
      console.log(`⏭️  Network ${networkId} is coming soon — skipping`);
      return;
    }

    console.log(`🚀 Starting monitor for ${config.name}…`);

    let monitor: AnyMonitor;

    if (config.provider === 'alchemy') {
      monitor = new EvmMonitorService(config, this.wsService, this.dbService, this.cacheService);
    } else if (config.provider === 'mempool') {
      monitor = new BitcoinMonitorService(config, this.wsService, this.dbService, this.cacheService);
    } else {
      return;
    }

    this.monitors.set(networkId, monitor);
    try {
      await monitor.start();
    } catch (err) {
      console.error(`❌ Failed to start ${config.name} monitor:`, err);
      this.monitors.delete(networkId);
      this.failedNetworks.add(networkId);
      console.warn(`⚠️  ${config.name} marked as unavailable — won't retry until restart`);
    }
  }

  private stopNetwork(networkId: string): void {
    const monitor = this.monitors.get(networkId);
    if (!monitor) return;
    monitor.stop();
    this.monitors.delete(networkId);
    console.log(`🛑 Monitor stopped for ${networkId}`);
  }

  getMonitor(networkId: string): AnyMonitor | undefined {
    return this.monitors.get(networkId);
  }

  getActiveNetworks(): string[] {
    return Array.from(this.monitors.keys());
  }
}
