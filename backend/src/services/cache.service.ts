import Redis from 'ioredis';
import { WhaleTransaction } from '../types';

const CACHE_KEY = 'whale:recent';
const MAX_CACHED = 100;

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

  /** Seed the cache from DB data (newest-first array). */
  async seed(transactions: WhaleTransaction[]): Promise<void> {
    if (!this.available || transactions.length === 0) return;
    try {
      const pipeline = this.redis.pipeline();
      pipeline.del(CACHE_KEY);
      // Push oldest→newest so lpush ends with newest at index 0
      for (let i = transactions.length - 1; i >= 0; i--) {
        pipeline.lpush(CACHE_KEY, JSON.stringify(transactions[i]));
      }
      await pipeline.exec();
      console.log(`✅ Redis seeded with ${transactions.length} whale transactions`);
    } catch (e) {
      console.error('❌ Redis seed error:', e);
    }
  }

  /** Add one transaction to the front of the cache. */
  async pushTransaction(tx: WhaleTransaction): Promise<void> {
    if (!this.available) return;
    try {
      await this.redis.lpush(CACHE_KEY, JSON.stringify(tx));
      await this.redis.ltrim(CACHE_KEY, 0, MAX_CACHED - 1);
    } catch (e) {
      console.error('❌ Redis push error:', e);
    }
  }

  /** Return up to MAX_CACHED transactions, newest first. */
  async getRecentTransactions(): Promise<WhaleTransaction[]> {
    if (!this.available) return [];
    try {
      const items = await this.redis.lrange(CACHE_KEY, 0, MAX_CACHED - 1);
      return items.map((item) => JSON.parse(item) as WhaleTransaction);
    } catch (e) {
      console.error('❌ Redis get error:', e);
      return [];
    }
  }
}
