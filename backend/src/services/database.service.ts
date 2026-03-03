import { Pool, QueryResultRow } from 'pg';
import { WhaleTransaction } from '../types';

interface TxRow extends QueryResultRow {
  tx_hash: string;
  block_number: string;
  from_address: string;
  to_address: string;
  value_eth: string;
  value_usd: string | null;
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
           (tx_hash, block_number, from_address, to_address, value_eth, value_usd, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7 / 1000.0))
         ON CONFLICT (tx_hash) DO NOTHING`,
        [tx.hash, tx.blockNumber, tx.from, tx.to, tx.valueEth, tx.valueUsd, tx.timestamp]
      );
    } catch (e) {
      console.error('❌ DB save error:', e);
    }
  }

  async getRecentTransactions(limit = 100): Promise<WhaleTransaction[]> {
    if (!this.available) return [];
    try {
      const { rows } = await this.pool.query<TxRow>(
        `SELECT tx_hash, block_number, from_address, to_address, value_eth, value_usd,
                EXTRACT(EPOCH FROM timestamp) * 1000 AS ts_ms
         FROM whale_transactions
         ORDER BY timestamp DESC
         LIMIT $1`,
        [limit]
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
      }));
    } catch (e) {
      console.error('❌ DB query error:', e);
      return [];
    }
  }
}
