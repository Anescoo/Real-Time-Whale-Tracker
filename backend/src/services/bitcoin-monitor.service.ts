import WebSocket from 'ws';
import { NetworkConfig } from '../config/networks';
import { WebSocketService } from './websocket.service';
import { DatabaseService } from './database.service';
import { CacheService } from './cache.service';
import { WhaleTransaction } from '../types';

interface MempoolTx {
  txid: string;
  vout: { value: number; scriptpubkey_address?: string }[];  // value in satoshis
  vin: { prevout?: { value: number; scriptpubkey_address?: string } }[];
}

interface MempoolBlock {
  id: string;
  height: number;
  tx_count: number;
}

export class BitcoinMonitorService {
  private ws: WebSocket | null = null;
  private btcPriceEur: number = 0;
  private recentTransactions: WhaleTransaction[] = [];
  private running = false;
  private priceInterval?: ReturnType<typeof setInterval>;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;
  private processedBlocks: Set<string> = new Set();

  private stats = {
    blocksProcessed: 0,
    whalesDetected: 0,
    totalVolumeBtc: 0,
    totalVolumeEur: 0,
    largestTransactionBtc: 0,
    last24hCount: 0,
    lastBlockNumber: 0,
  };

  constructor(
    private readonly networkConfig: NetworkConfig,
    private readonly wsService: WebSocketService,
    private readonly dbService?: DatabaseService,
    private readonly cacheService?: CacheService,
  ) {
    console.log('✅ Bitcoin monitor initialized');
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    console.log('👂 Starting Bitcoin monitoring via Mempool.space…');

    await this.updatePrice();
    this.priceInterval = setInterval(() => this.updatePrice(), 60_000);

    this.connectWebSocket();

    // Process latest block immediately so stats/transactions are available right away
    // (Bitcoin blocks come every ~10 min — without this, frontend shows 0 until next block)
    this.fetchAndProcessLatestBlock().catch(() => {});
  }

  private async fetchAndProcessLatestBlock(): Promise<void> {
    try {
      const hashRes = await fetch('https://mempool.space/api/blocks/tip/hash');
      if (!hashRes.ok) return;
      const blockHash = (await hashRes.text()).trim();

      const blockRes = await fetch(`https://mempool.space/api/block/${blockHash}`);
      if (!blockRes.ok) return;
      const block = await blockRes.json() as MempoolBlock;

      console.log(`🔍 [Bitcoin] Fetching latest block #${block.height} for initial data…`);
      await this.processBlock(block);
    } catch (err) {
      console.error('❌ Failed to fetch initial Bitcoin block:', (err as Error).message);
    }
  }

  stop(): void {
    this.running = false;
    if (this.priceInterval) clearInterval(this.priceInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    console.log('🛑 Bitcoin monitor stopped');
  }

  private connectWebSocket(): void {
    if (!this.running) return;

    this.ws = new WebSocket('wss://mempool.space/api/v1/ws');

    this.ws.on('open', () => {
      console.log('✅ Connected to Mempool.space WebSocket');
      this.ws?.send(JSON.stringify({ action: 'want', data: ['blocks'] }));
    });

    this.ws.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as { block?: MempoolBlock };
        if (msg.block) {
          await this.processBlock(msg.block);
        }
      } catch { /* ignore malformed messages */ }
    });

    this.ws.on('close', () => {
      if (!this.running) return;
      console.warn('⚠️  Mempool.space WS closed, reconnecting in 5s…');
      this.reconnectTimeout = setTimeout(() => this.connectWebSocket(), 5_000);
    });

    this.ws.on('error', (err) => {
      console.error('❌ Mempool.space WS error:', err.message);
    });
  }

  private async updatePrice(): Promise<void> {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCEUR');
      const data = await res.json() as { price?: string };
      const price = parseFloat(data.price ?? '');
      if (isNaN(price) || price <= 0) throw new Error('Invalid Binance response');
      this.btcPriceEur = price;
      console.log(`💰 BTC: €${this.btcPriceEur.toFixed(0)}`);
      this.wsService.broadcastToNetwork('eth:price', this.btcPriceEur, this.networkConfig.id);
    } catch {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
        const data = await res.json() as { bitcoin?: { eur: number } };
        const price = data.bitcoin?.eur;
        if (price && price > 0) {
          this.btcPriceEur = price;
          this.wsService.broadcastToNetwork('eth:price', this.btcPriceEur, this.networkConfig.id);
        }
      } catch {
        // Keep last known price
      }
    }
  }

  private async processBlock(block: MempoolBlock): Promise<void> {
    if (this.processedBlocks.has(block.id)) return;
    this.processedBlocks.add(block.id);
    if (this.processedBlocks.size > 20) {
      const oldest = Array.from(this.processedBlocks)[0];
      this.processedBlocks.delete(oldest);
    }

    console.log(`📦 [Bitcoin] Block #${block.height} | ${block.tx_count} txs`);
    this.stats.blocksProcessed++;
    this.stats.lastBlockNumber = block.height;

    // Paginate through all transactions in the block
    const pageSize = 25;
    const totalPages = Math.ceil(block.tx_count / pageSize);

    for (let page = 0; page < totalPages; page++) {
      if (!this.running) break;
      const startIndex = page * pageSize;
      try {
        const res = await fetch(`https://mempool.space/api/block/${block.id}/txs/${startIndex}`);
        if (!res.ok) break;
        const txs = await res.json() as MempoolTx[];

        for (const tx of txs) {
          // vout.value is in satoshis — convert to BTC for threshold comparison
          const totalOutSats = tx.vout.reduce((sum, out) => sum + (out.value ?? 0), 0);
          const totalOut = totalOutSats / 1e8; // BTC
          if (totalOut < this.networkConfig.threshold) continue;

          // Use real addresses from scriptpubkey_address when available
          const fromAddr = tx.vin[0]?.prevout?.scriptpubkey_address
            ?? (tx.vin[0]?.prevout ? 'unknown' : 'coinbase');
          const toAddr = tx.vout[0]?.scriptpubkey_address ?? 'unknown';

          this.stats.whalesDetected++;
          this.stats.totalVolumeBtc += totalOut;
          this.stats.totalVolumeEur += totalOut * this.btcPriceEur;
          if (totalOut > this.stats.largestTransactionBtc) {
            this.stats.largestTransactionBtc = totalOut;
          }

          const whaleTx: WhaleTransaction = {
            hash: tx.txid,
            from: fromAddr,
            to: toAddr,
            value: String(Math.round(totalOutSats)), // raw satoshis
            valueEth: totalOut,
            valueUsd: totalOut * this.btcPriceEur,
            blockNumber: block.height,
            timestamp: Date.now(),
            network: this.networkConfig.id,
          };

          this.recentTransactions.unshift(whaleTx);
          if (this.recentTransactions.length > 250) this.recentTransactions.pop();

          this.stats.last24hCount = this.recentTransactions.filter(
            (t) => t.timestamp >= Date.now() - 86_400_000
          ).length;

          this.dbService?.saveTransaction(whaleTx);
          this.cacheService?.pushTransaction(whaleTx, this.networkConfig.id);
          this.wsService.broadcastToNetwork('whale:transaction', whaleTx, this.networkConfig.id);

          console.log(
            `🐋 [Bitcoin] #${this.stats.whalesDetected} | ` +
            `${totalOut.toFixed(4)} BTC (€${(totalOut * this.btcPriceEur).toLocaleString('en-US', { maximumFractionDigits: 0 })}) | ` +
            `block #${block.height} | from: ${fromAddr.slice(0, 12)}…`
          );
        }

        // Small delay between pages to avoid rate limiting
        if (page < totalPages - 1) {
          await new Promise((r) => setTimeout(r, 100));
        }
      } catch (err) {
        console.error(`❌ Error fetching BTC block txs (page ${page}):`, err);
        break;
      }
    }

    this.wsService.broadcastToNetwork('stats:update', this.getStats(), this.networkConfig.id);
  }

  public getRecentTransactions(limit = 50): WhaleTransaction[] {
    return this.recentTransactions.slice(0, limit);
  }

  public getStats() {
    return {
      blocksProcessed: this.stats.blocksProcessed,
      whalesDetected: this.stats.whalesDetected,
      totalVolumeEth: parseFloat(this.stats.totalVolumeBtc.toFixed(4)),
      totalVolumeUsd: parseFloat(this.stats.totalVolumeEur.toFixed(2)),
      largestTransactionEth: parseFloat(this.stats.largestTransactionBtc.toFixed(4)),
      last24hCount: this.stats.last24hCount,
      lastBlockNumber: this.stats.lastBlockNumber,
      ethPrice: this.btcPriceEur,
      whaleThreshold: this.networkConfig.threshold,
      connectedClients: this.wsService.getConnectedClientsCount(),
      network: this.networkConfig.id,
      symbol: this.networkConfig.symbol,
    };
  }
}
