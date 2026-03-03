import { Transaction } from '../hooks/useWebSocket';
import { lookupAddress } from '../utils/knownAddresses';

interface Props {
  transactions: Transaction[];
  ethPrice: number;
  onAddressClick: (address: string) => void;
  symbol?: string;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function rankClass(i: number) {
  if (i === 0) return 'rank-num rank-1';
  if (i === 1) return 'rank-num rank-2';
  if (i === 2) return 'rank-num rank-3';
  return 'rank-num rank-n';
}

function amountColor(eth: number) {
  if (eth >= 1000) return 'var(--red)';
  if (eth >= 500)  return 'var(--amber)';
  return 'var(--blue)';
}

export function TopWhales({ transactions, ethPrice, onAddressClick, symbol = 'ETH' }: Props) {
  const byAddress = new Map<string, Transaction>();
  for (const tx of transactions) {
    const prev = byAddress.get(tx.from);
    if (!prev || tx.valueEth > prev.valueEth) byAddress.set(tx.from, tx);
  }
  const top10 = Array.from(byAddress.values())
    .sort((a, b) => b.valueEth - a.valueEth)
    .slice(0, 10);

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">
          Top whales
          <span className="section-count">{top10.length}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>by largest tx</span>
      </div>

      {top10.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📊</div>
          <p>No data yet</p>
        </div>
      ) : (
        <div>
          {top10.map((tx, i) => {
            const usd = tx.valueUsd > 0 ? tx.valueUsd : tx.valueEth * ethPrice;
            const label = lookupAddress(tx.from);
            return (
              <button
                key={tx.from}
                className="whale-rank-item whale-rank-clickable"
                onClick={() => onAddressClick(tx.from)}
                title="View profile"
              >
                <div className={rankClass(i)}>{i + 1}</div>
                <div className="rank-info">
                  <div className="rank-addr">
                    {label
                      ? <span className={`known-badge known-badge-${label.type}`}>{label.name}</span>
                      : <>{tx.from.slice(0, 8)}…{tx.from.slice(-6)}</>
                    }
                  </div>
                  <div className="rank-time">{timeAgo(tx.timestamp)}</div>
                </div>
                <div className="rank-amount" style={{ color: amountColor(tx.valueEth) }}>
                  <div>
                    {tx.valueEth >= 10000
                      ? `${(tx.valueEth / 1000).toFixed(1)}K`
                      : tx.valueEth.toFixed(1)} {symbol}
                  </div>
                  {usd > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 400 }}>
                      €{usd >= 1_000_000
                        ? `${(usd / 1_000_000).toFixed(2)}M`
                        : usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
