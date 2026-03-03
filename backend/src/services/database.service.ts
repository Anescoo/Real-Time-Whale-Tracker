import { Pool, QueryResultRow } from 'pg';
import { WhaleTransaction } from '../types';

interface TxRow extends QueryResultRow {
  tx_hash: string;
  block_number: string;
  from_address: string;
  to_address: string;
  value_eth: string;
  value_usd: string | null;
  network: string;
  ts_ms: string;
}

export class DatabaseService {
  private pool: Pool;
  private available = false;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async connect(): Promise<void> {
    const client = await this.pool.connect();
    client.release();
    this.available = true;
    console.log('✅ PostgreSQL connected');
  }

  async saveTransaction(tx: WhaleTransaction): Promise<void> {
    if (!this.available) return;
    try {
      await this.pool.query(
        `INSERT INTO whale_transactions
           (tx_hash, block_number, from_address, to_address, value_eth, value_usd, timestamp, network)
         VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7 / 1000.0), $8)
         ON CONFLICT (tx_hash) DO NOTHING`,
        [tx.hash, tx.blockNumber, tx.from, tx.to, tx.valueEth, tx.valueUsd, tx.timestamp, tx.network]
      );
    } catch (e) {
      console.error('❌ DB save error:', e);
    }
  }

  async getCountSince(sinceMs: number, network: string): Promise<number> {
    if (!this.available) return 0;
    try {
      const { rows } = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM whale_transactions
         WHERE timestamp >= to_timestamp($1 / 1000.0) AND network = $2`,
        [sinceMs, network]
      );
      return parseInt(rows[0]?.count ?? '0', 10);
    } catch (e) {
      console.error('❌ DB count error:', e);
      return 0;
    }
  }

  async likeTransaction(hash: string): Promise<void> {
    if (!this.available) return;
    try {
      await this.pool.query(
        `INSERT INTO whale_likes (tx_hash) VALUES ($1) ON CONFLICT DO NOTHING`,
        [hash]
      );
    } catch (e) {
      console.error('❌ DB like error:', e);
    }
  }

  async unlikeTransaction(hash: string): Promise<void> {
    if (!this.available) return;
    try {
      await this.pool.query(`DELETE FROM whale_likes WHERE tx_hash = $1`, [hash]);
    } catch (e) {
      console.error('❌ DB unlike error:', e);
    }
  }

  async getLikedHashes(): Promise<string[]> {
    if (!this.available) return [];
    try {
      const { rows } = await this.pool.query<{ tx_hash: string }>(
        `SELECT tx_hash FROM whale_likes ORDER BY created_at DESC`
      );
      return rows.map((r) => r.tx_hash);
    } catch (e) {
      console.error('❌ DB liked error:', e);
      return [];
    }
  }

  async getRecentTransactions(limit = 100, network?: string): Promise<WhaleTransaction[]> {
    if (!this.available) return [];
    try {
      const params: (number | string)[] = [limit];
      const networkFilter = network ? `WHERE network = $2` : '';
      if (network) params.push(network);

      const { rows } = await this.pool.query<TxRow>(
        `SELECT tx_hash, block_number, from_address, to_address, value_eth, value_usd, network,
                EXTRACT(EPOCH FROM timestamp) * 1000 AS ts_ms
         FROM whale_transactions
         ${networkFilter}
         ORDER BY timestamp DESC
         LIMIT $1`,
        params
      );
      return rows.map((r) => ({
        hash: r.tx_hash,
        blockNumber: Number(r.block_number),
        from: r.from_address,
        to: r.to_address,
        value: '0x0',
        valueEth: parseFloat(r.value_eth),
        valueUsd: parseFloat(r.value_usd ?? '0'),
        timestamp: Math.round(parseFloat(r.ts_ms)),
        network: r.network ?? 'eth-mainnet',
      }));
    } catch (e) {
      console.error('❌ DB query error:', e);
      return [];
    }
  }
}
