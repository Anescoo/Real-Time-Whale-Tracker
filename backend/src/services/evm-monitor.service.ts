import { Alchemy, Utils } from 'alchemy-sdk';
import { NetworkConfig } from '../config/networks';
import { WebSocketService } from './websocket.service';
import { DatabaseService } from './database.service';
import { CacheService } from './cache.service';
import { WhaleTransaction } from '../types';

export class EvmMonitorService {
  private alchemy: Alchemy;
  private priceNative: number = 0;
  private processedTxs: Set<string> = new Set();
  private recentTransactions: WhaleTransaction[] = [];
  private running = false;
  private priceInterval: ReturnType<typeof setInterval> | null = null;

  private stats = {
    blocksProcessed: 0,
    whalesDetected: 0,
    totalVolumeNative: 0,
    totalVolumeEur: 0,
    largestTransactionNative: 0,
    last24hCount: 0,
    lastBlockNumber: 0,
  };

  constructor(
    private readonly networkConfig: NetworkConfig,
    private readonly wsService: WebSocketService,
    private readonly dbService?: DatabaseService,
    private readonly cacheService?: CacheService,
  ) {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) throw new Error('❌ ALCHEMY_API_KEY not found in environment');
    this.alchemy = new Alchemy({ apiKey, network: networkConfig.alchemyNetwork! });
    console.log(`✅ EVM monitor initialized for ${networkConfig.name}`);
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    console.log(`👂 Starting ${this.networkConfig.name} monitoring…`);

    await this.updatePrice();
    this.priceInterval = setInterval(() => this.updatePrice(), 30_000);

    this.alchemy.ws.on('block', async (blockNumber: number) => {
      if (!this.running) return;
      await this.processBlock(blockNumber);
    });

    try {
      const latestBlock = await this.alchemy.core.getBlockNumber();
      console.log(`✅ Connected to ${this.networkConfig.name}! Latest block: ${latestBlock}`);
      await this.processBlock(latestBlock);
    } catch (err) {
      // Connection failed (e.g. network not enabled on this API key) — clean up and rethrow
      this.stop();
      throw err;
    }
  }

  stop(): void {
    this.running = false;
    if (this.priceInterval) {
      clearInterval(this.priceInterval);
      this.priceInterval = null;
    }
    console.log(`🛑 Stopping ${this.networkConfig.name} monitoring`);
  }

  private async updatePrice(): Promise<void> {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${this.networkConfig.priceSymbol}`);
      const data = await res.json() as { price: string };
      this.priceNative = parseFloat(data.price);
      console.log(`💰 ${this.networkConfig.symbol}: €${this.priceNative.toFixed(2)} [${this.networkConfig.name}]`);
      this.wsService.broadcastToNetwork('eth:price', this.priceNative, this.networkConfig.id);
    } catch {
      try {
        const coin = this.networkConfig.priceSymbol.replace('EUR', '').toLowerCase();
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=eur`);
        const data = await res.json() as Record<string, { eur: number }>;
        this.priceNative = data[coin]?.eur ?? this.priceNative;
        this.wsService.broadcastToNetwork('eth:price', this.priceNative, this.networkConfig.id);
      } catch {
        this.priceNative = this.priceNative || 0;
      }
    }
  }

  private async fetchBlockWithRetry(blockNumber: number, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.alchemy.core.getBlockWithTransactions(blockNumber);
      } catch (err) {
        if (attempt === maxRetries) throw err;
        const delay = 1000 * Math.pow(2, attempt);
        console.warn(`⚠️  Block #${blockNumber} fetch failed (${this.networkConfig.name}), retrying in ${delay / 1000}s…`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  private async processBlock(blockNumber: number): Promise<void> {
    try {
      const block = await this.fetchBlockWithRetry(blockNumber);
      if (!block?.transactions) return;

      this.stats.blocksProcessed++;
      this.stats.lastBlockNumber = blockNumber;

      console.log(`📦 [${this.networkConfig.name}] Block #${blockNumber} | ${block.transactions.length} txs`);

      for (const tx of block.transactions) {
        if (this.processedTxs.has(tx.hash)) continue;
        if (!tx.value || tx.value.toString() === '0') continue;

        const valueNative = parseFloat(Utils.formatEther(tx.value));
        if (valueNative < this.networkConfig.threshold) continue;

        this.stats.whalesDetected++;
        this.stats.totalVolumeNative += valueNative;
        this.stats.totalVolumeEur += valueNative * this.priceNative;
        if (valueNative > this.stats.largestTransactionNative) {
          this.stats.largestTransactionNative = valueNative;
        }

        const whaleTx: WhaleTransaction = {
          hash: tx.hash,
          from: tx.from,
          to: tx.to || 'Contract Creation',
          value: tx.value.toString(),
          valueEth: valueNative,
          valueUsd: valueNative * this.priceNative,
          blockNumber,
          timestamp: Date.now(),
          network: this.networkConfig.id,
        };

        this.recentTransactions.unshift(whaleTx);
        if (this.recentTransactions.length > 100) this.recentTransactions.pop();

        this.stats.last24hCount = this.recentTransactions.filter(
          (t) => t.timestamp >= Date.now() - 86_400_000
        ).length;

        this.processedTxs.add(tx.hash);

        this.dbService?.saveTransaction(whaleTx);
        this.cacheService?.pushTransaction(whaleTx, this.networkConfig.id);
        this.wsService.broadcastToNetwork('whale:transaction', whaleTx, this.networkConfig.id);

        console.log(
          `🐋 [${this.networkConfig.name}] #${this.stats.whalesDetected} | ` +
          `${valueNative.toFixed(2)} ${this.networkConfig.symbol} ` +
          `(€${(valueNative * this.priceNative).toLocaleString('en-US', { maximumFractionDigits: 0 })}) | ` +
          `block #${blockNumber}`
        );
      }

      if (this.processedTxs.size > 1000) {
        this.processedTxs = new Set(Array.from(this.processedTxs).slice(-1000));
      }

      this.wsService.broadcastToNetwork('stats:update', this.getStats(), this.networkConfig.id);
    } catch (error) {
      console.error(`❌ Error processing block ${blockNumber} on ${this.networkConfig.name}:`, error);
    }
  }

  public getRecentTransactions(limit = 50): WhaleTransaction[] {
    return this.recentTransactions.slice(0, limit);
  }

  public getStats() {
    return {
      blocksProcessed: this.stats.blocksProcessed,
      whalesDetected: this.stats.whalesDetected,
      totalVolumeEth: parseFloat(this.stats.totalVolumeNative.toFixed(2)),
      totalVolumeUsd: parseFloat(this.stats.totalVolumeEur.toFixed(2)),
      largestTransactionEth: parseFloat(this.stats.largestTransactionNative.toFixed(2)),
      last24hCount: this.stats.last24hCount,
      lastBlockNumber: this.stats.lastBlockNumber,
      ethPrice: this.priceNative,
      whaleThreshold: this.networkConfig.threshold,
      connectedClients: this.wsService.getConnectedClientsCount(),
      network: this.networkConfig.id,
      symbol: this.networkConfig.symbol,
    };
  }
}
