import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { WebSocketService } from './websocket.service';

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueEth: number;
  valueUsd: number;
  blockNumber: number;
  timestamp: number;
}

export class EthereumService {
  private alchemy: Alchemy;
  private wsService: WebSocketService;
  private whaleThreshold: number;
  private ethPriceUsd: number = 0;
  private processedTxs: Set<string> = new Set();
  private recentTransactions: WhaleTransaction[] = [];

  private stats = {
    blocksProcessed: 0,
    whalesDetected: 0,
    totalVolumeEth: 0,
    totalVolumeUsd: 0,
    largestTransactionEth: 0,
    last24hCount: 0,
    lastBlockNumber: 0,
  };

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
    this.whaleThreshold = parseFloat(process.env.WHALE_THRESHOLD_ETH || '100');

    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) throw new Error('❌ ALCHEMY_API_KEY not found in environment');

    this.alchemy = new Alchemy({ apiKey, network: Network.ETH_MAINNET });

    console.log('✅ Ethereum service initialized');
    console.log(`🐋 Whale threshold: ${this.whaleThreshold} ETH`);
  }

  async start() {
    console.log('👂 Starting Ethereum monitoring...');

    await this.updateEthPrice();
    setInterval(() => this.updateEthPrice(), 5 * 60 * 1000);

    this.alchemy.ws.on('block', async (blockNumber: number) => {
      await this.processBlock(blockNumber);
    });

    const latestBlock = await this.alchemy.core.getBlockNumber();
    console.log(`✅ Connected to Ethereum! Latest block: ${latestBlock}`);
    await this.processBlock(latestBlock);
  }

  private async updateEthPrice() {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      const data = await response.json();
      this.ethPriceUsd = data.ethereum.usd;
      console.log(`💰 ETH price: $${this.ethPriceUsd.toFixed(2)}`);
      this.wsService.broadcastEthPrice(this.ethPriceUsd);
    } catch {
      this.ethPriceUsd = this.ethPriceUsd || 2000;
    }
  }

  private async fetchBlockWithRetry(blockNumber: number, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.alchemy.core.getBlockWithTransactions(blockNumber);
      } catch (err) {
        if (attempt === maxRetries) throw err;
        const delay = 1000 * Math.pow(2, attempt); // 1s → 2s → 4s
        console.warn(`⚠️  Block #${blockNumber} fetch failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay / 1000}s…`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  private async processBlock(blockNumber: number) {
    try {
      const block = await this.fetchBlockWithRetry(blockNumber);
      if (!block?.transactions) return;

      this.stats.blocksProcessed++;
      this.stats.lastBlockNumber = blockNumber;

      console.log(`📦 Block #${blockNumber} | ${block.transactions.length} txs scanned`);

      for (const tx of block.transactions) {
        if (this.processedTxs.has(tx.hash)) continue;
        if (!tx.value || tx.value.toString() === '0') continue;

        const valueEth = parseFloat(Utils.formatEther(tx.value));
        if (valueEth < this.whaleThreshold) continue;

        this.stats.whalesDetected++;
        this.stats.totalVolumeEth += valueEth;
        this.stats.totalVolumeUsd += valueEth * this.ethPriceUsd;
        if (valueEth > this.stats.largestTransactionEth) {
          this.stats.largestTransactionEth = valueEth;
        }

        const whaleTx: WhaleTransaction = {
          hash: tx.hash,
          from: tx.from,
          to: tx.to || 'Contract Creation',
          value: tx.value.toString(),
          valueEth,
          valueUsd: valueEth * this.ethPriceUsd,
          blockNumber,
          timestamp: Date.now(),
        };

        this.recentTransactions.unshift(whaleTx);
        if (this.recentTransactions.length > 100) this.recentTransactions.pop();

        this.stats.last24hCount = this.recentTransactions.filter(
          (t) => t.timestamp >= Date.now() - 86_400_000
        ).length;

        this.processedTxs.add(tx.hash);
        this.wsService.broadcastWhaleTransaction(whaleTx);

        console.log(`🐋 Whale #${this.stats.whalesDetected} | ${valueEth.toFixed(2)} ETH ($${(valueEth * this.ethPriceUsd).toLocaleString('en-US', { maximumFractionDigits: 0 })}) | block #${blockNumber} | from ${tx.from.slice(0, 10)}…`);
      }

      if (this.processedTxs.size > 1000) {
        this.processedTxs = new Set(Array.from(this.processedTxs).slice(-1000));
      }

      this.wsService.broadcastStats(this.getStats());
    } catch (error) {
      console.error(`❌ Error processing block ${blockNumber}:`, error);
    }
  }

  public getRecentTransactions(limit = 50): WhaleTransaction[] {
    return this.recentTransactions.slice(0, limit);
  }

  public getStats() {
    return {
      blocksProcessed: this.stats.blocksProcessed,
      whalesDetected: this.stats.whalesDetected,
      totalVolumeEth: parseFloat(this.stats.totalVolumeEth.toFixed(2)),
      totalVolumeUsd: parseFloat(this.stats.totalVolumeUsd.toFixed(2)),
      largestTransactionEth: parseFloat(this.stats.largestTransactionEth.toFixed(2)),
      last24hCount: this.stats.last24hCount,
      lastBlockNumber: this.stats.lastBlockNumber,
      ethPrice: this.ethPriceUsd,
      whaleThreshold: this.whaleThreshold,
      connectedClients: this.wsService.getConnectedClientsCount(),
    };
  }
}
