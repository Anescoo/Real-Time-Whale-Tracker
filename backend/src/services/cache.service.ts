import Redis from 'ioredis';
import { WhaleTransaction } from '../types';

const MAX_CACHED = 250;

function cacheKey(networkId: string): string {
  return `whale:recent:${networkId}`;
}

export class CacheService {
  private redis: Redis;
  private available = false;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
    this.available = true;
    console.log('✅ Redis connected');
  }

  /** Seed the cache for a given network from DB data (newest-first array). */
  async seed(transactions: WhaleTransaction[], networkId: string): Promise<void> {
    if (!this.available || transactions.length === 0) return;
    try {
      const key = cacheKey(networkId);
      const pipeline = this.redis.pipeline();
      pipeline.del(key);
      // Push oldest→newest so lpush ends with newest at index 0
      for (let i = transactions.length - 1; i >= 0; i--) {
        pipeline.lpush(key, JSON.stringify(transactions[i]));
      }
      await pipeline.exec();
      console.log(`✅ Redis seeded with ${transactions.length} transactions for ${networkId}`);
    } catch (e) {
      console.error('❌ Redis seed error:', e);
    }
  }

  /** Add one transaction to the front of the cache. */
  async pushTransaction(tx: WhaleTransaction, networkId: string): Promise<void> {
    if (!this.available) return;
    try {
      const key = cacheKey(networkId);
      await this.redis.lpush(key, JSON.stringify(tx));
      await this.redis.ltrim(key, 0, MAX_CACHED - 1);
    } catch (e) {
      console.error('❌ Redis push error:', e);
    }
  }

  /** Return up to MAX_CACHED transactions for a network, newest first. */
  async getRecentTransactions(networkId: string): Promise<WhaleTransaction[]> {
    if (!this.available) return [];
    try {
      const items = await this.redis.lrange(cacheKey(networkId), 0, MAX_CACHED - 1);
      return items.map((item) => JSON.parse(item) as WhaleTransaction);
    } catch (e) {
      console.error('❌ Redis get error:', e);
      return [];
    }
  }
}
