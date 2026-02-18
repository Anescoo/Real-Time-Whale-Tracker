import { Alchemy, Network, Utils } from "alchemy-sdk";
import { WebSocketService } from "./websocket.service";

interface WhaleTransaction {
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
  
  // ✅ AJOUT : Stockage des transactions récentes
  private recentTransactions: WhaleTransaction[] = [];
  
  private stats = {
    blocksProcessed: 0,
    whalesDetected: 0,
    totalVolume: 0,
    // ✅ AJOUT : Stats complètes pour l'API
    totalVolumeUsd: 0,
    averageTransactionEth: 0,
    largestTransactionEth: 0,
    last24hCount: 0,
  };

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
    this.whaleThreshold = parseFloat(
      process.env.WHALE_THRESHOLD_ETH || "100"
    );

    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) {
      throw new Error("❌ ALCHEMY_API_KEY not found in environment");
    }

    this.alchemy = new Alchemy({
      apiKey,
      network: Network.ETH_MAINNET,
    });

    console.log("✅ Ethereum service initialized");
    console.log(`🐋 Whale threshold: ${this.whaleThreshold} ETH`);
  }

  async start() {
    console.log("👂 Starting Ethereum monitoring...");

    // Update ETH price
    await this.updateEthPrice();
    setInterval(() => this.updateEthPrice(), 5 * 60 * 1000);

    // Listen to new blocks
    console.log("🔗 Setting up block listener...");

    this.alchemy.ws.on("block", async (blockNumber: number) => {
      console.log(`\n📦 NEW BLOCK: ${blockNumber}`);
      await this.processBlock(blockNumber);
    });

    // Test connection
    const latestBlock = await this.alchemy.core.getBlockNumber();
    console.log(`✅ Connected to Ethereum! Latest block: ${latestBlock}`);
    console.log("✅ Monitoring active!");

    // Process current block immediately
    await this.processBlock(latestBlock);
  }

  private async updateEthPrice() {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await response.json();
      this.ethPriceUsd = data.ethereum.usd;
      console.log(`💰 ETH price updated: $${this.ethPriceUsd.toFixed(2)}`);
      
      // ✅ AJOUT : Broadcast du prix ETH
      this.wsService.broadcastEthPrice(this.ethPriceUsd);
    } catch (error) {
      console.error("❌ Failed to fetch ETH price:", error);
      this.ethPriceUsd = 2000; // Fallback
    }
  }

  private async processBlock(blockNumber: number) {
    try {
      console.log(`⏳ Fetching block ${blockNumber}...`);

      const blockWithTxs = await this.alchemy.core.getBlockWithTransactions(
        blockNumber
      );

      if (!blockWithTxs || !blockWithTxs.transactions) {
        console.log(`⚠️ Block ${blockNumber} has no transactions`);
        return;
      }

      this.stats.blocksProcessed++;
      const txCount = blockWithTxs.transactions.length;
      console.log(`📦 Block ${blockNumber}: ${txCount} transactions`);

      let whalesInBlock = 0;
      let largeTransactions = 0;

      for (const tx of blockWithTxs.transactions) {
        // Skip already processed
        if (this.processedTxs.has(tx.hash)) continue;

        // Skip 0 value
        if (!tx.value || tx.value.toString() === "0") continue;

        const valueEth = parseFloat(Utils.formatEther(tx.value));

        // Log large transactions (>100 ETH)
        if (valueEth >= 100) {
          largeTransactions++;
          console.log(`   💎 Large tx: ${valueEth.toFixed(2)} ETH (${tx.hash.slice(0, 10)}...)`);
        }

        // Detect whales
        if (valueEth >= this.whaleThreshold) {
          whalesInBlock++;
          this.stats.whalesDetected++;
          this.stats.totalVolume += valueEth;

          const valueUsd = valueEth * this.ethPriceUsd;
          
          // ✅ MODIFICATION : Mise à jour des stats complètes
          this.stats.totalVolumeUsd += valueUsd;
          this.stats.averageTransactionEth = this.stats.totalVolume / this.stats.whalesDetected;
          
          if (valueEth > this.stats.largestTransactionEth) {
            this.stats.largestTransactionEth = valueEth;
          }

          const whaleTransaction: WhaleTransaction = {
            hash: tx.hash,
            from: tx.from,
            to: tx.to || "Contract Creation",
            value: tx.value.toString(),
            valueEth,
            valueUsd,
            blockNumber,
            timestamp: Date.now(),
          };

          console.log(`\n🐋 ═══════════════════════════════════`);
          console.log(`🐋 WHALE DETECTED!`);
          console.log(`   💰 Amount: ${valueEth.toFixed(2)} ETH ($${valueUsd.toLocaleString()})`);
          console.log(`   📤 From: ${tx.from}`);
          console.log(`   📥 To: ${tx.to}`);
          console.log(`   🔗 Hash: ${tx.hash}`);
          console.log(`🐋 ═══════════════════════════════════\n`);

          // ✅ AJOUT : Stocker la transaction
          this.recentTransactions.unshift(whaleTransaction);
          
          // Garder uniquement les 100 dernières
          if (this.recentTransactions.length > 100) {
            this.recentTransactions.pop();
          }

          // ✅ AJOUT : Mettre à jour le compteur 24h
          this.updateLast24hCount();

          this.processedTxs.add(tx.hash);
          this.wsService.broadcastWhaleTransaction(whaleTransaction);
        }
      }

      if (largeTransactions > 0) {
        console.log(`   ✅ Found ${largeTransactions} transactions >100 ETH`);
      }

      if (whalesInBlock > 0) {
        console.log(`🎉 ${whalesInBlock} whale(s) found in block ${blockNumber}\n`);
      } else {
        console.log(`   ℹ️ No whales in this block\n`);
      }

      // Clean old processed txs (keep last 1000)
      if (this.processedTxs.size > 1000) {
        const txArray = Array.from(this.processedTxs);
        this.processedTxs = new Set(txArray.slice(-1000));
      }

    } catch (error) {
      console.error(`❌ Error processing block ${blockNumber}:`, error);
    }
  }

  // ✅ NOUVELLE MÉTHODE : Mettre à jour le compteur des dernières 24h
  private updateLast24hCount() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    
    this.stats.last24hCount = this.recentTransactions.filter(
      (tx) => tx.timestamp >= last24h
    ).length;
  }

  // ✅ NOUVELLE MÉTHODE : Récupérer les transactions récentes
  public getRecentTransactions(limit: number = 20): WhaleTransaction[] {
    return this.recentTransactions.slice(0, limit);
  }

  // ✅ MODIFICATION : Retourner les stats complètes
  public getStats() {
    return {
      blocksProcessed: this.stats.blocksProcessed,
      totalWhales: this.stats.whalesDetected,
      totalVolumeEth: parseFloat(this.stats.totalVolume.toFixed(2)),
      totalVolumeUsd: parseFloat(this.stats.totalVolumeUsd.toFixed(2)),
      averageTransactionEth: parseFloat(this.stats.averageTransactionEth.toFixed(2)),
      largestTransactionEth: parseFloat(this.stats.largestTransactionEth.toFixed(2)),
      last24hCount: this.stats.last24hCount,
      ethPriceUsd: this.ethPriceUsd,
      whaleThreshold: this.whaleThreshold,
      connectedClients: this.wsService.getConnectedClientsCount(),
    };
  }
}
