import { Transaction } from '../hooks/useWebSocket';
import { lookupAddress } from '../utils/knownAddresses';

interface Props {
  transactions: Transaction[];
  ethPrice: number;
  newestHash: string | null;
  onAddressClick: (address: string) => void;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function shortAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }
function amountClass(eth: number) {
  if (eth >= 1000) return 'amount-xxl';
  if (eth >= 500) return 'amount-xl';
  return 'amount-lg';
}
function badgeClass(eth: number) {
  if (eth >= 1000) return 'size-badge badge-xxl';
  if (eth >= 500) return 'size-badge badge-xl';
  return 'size-badge badge-lg';
}
function badgeLabel(eth: number) {
  if (eth >= 1000) return 'Massive';
  if (eth >= 500) return 'Very large';
  return 'Large';
}
function fmtEth(eth: number) {
  return eth >= 10000 ? `${(eth / 1000).toFixed(1)}K` : eth.toFixed(2);
}

function exportCsv(transactions: Transaction[]) {
  const header = 'hash,blockNumber,from,to,valueEth,valueUsd,timestamp\n';
  const rows = transactions
    .map((tx) =>
      `${tx.hash},${tx.blockNumber},${tx.from},${tx.to},${tx.valueEth},${tx.valueUsd},${new Date(tx.timestamp).toISOString()}`
    )
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whale-txs-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AddrChip({ address, onClick }: { address: string; onClick: (a: string) => void }) {
  const label = lookupAddress(address);
  return (
    <button
      className={`addr-chip${label ? ` addr-chip-known addr-chip-${label.type}` : ''}`}
      onClick={() => onClick(address)}
      title={address}
    >
      {label ? label.name : shortAddr(address)}
    </button>
  );
}

export function WhalesFeed({ transactions, ethPrice, newestHash, onAddressClick }: Props) {
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">
          Recent whale transactions
          <span className="section-count">{transactions.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>live</span>
          {transactions.length > 0 && (
            <button className="export-btn" onClick={() => exportCsv(transactions)} title="Export CSV">
              ↓ CSV
            </button>
          )}
        </div>
      </div>

      <div className="whale-list">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🐋</div>
            <p>Watching for large transactions…</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const usd = tx.valueUsd > 0 ? tx.valueUsd : tx.valueEth * ethPrice;
            const toLabel   = lookupAddress(tx.to);
            const fromLabel = lookupAddress(tx.from);
            const arrowColor = toLabel?.type === 'exchange'
              ? 'var(--red)'
              : fromLabel?.type === 'exchange'
              ? 'var(--green)'
              : 'var(--text-3)';

            return (
              <div key={tx.hash} className={`whale-item${tx.hash === newestHash ? ' new-entry' : ''}`}>
                <div>
                  <div className={`whale-amount ${amountClass(tx.valueEth)}`}>
                    {fmtEth(tx.valueEth)} ETH
                  </div>
                  {usd > 0 && (
                    <div className="whale-usd">
                      ≈ €{usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  )}
                  <div className="whale-addresses">
                    <AddrChip address={tx.from} onClick={onAddressClick} />
                    <span style={{ color: arrowColor, fontWeight: 700 }}>→</span>
                    <AddrChip address={tx.to} onClick={onAddressClick} />
                  </div>
                </div>

                <div className="whale-meta">
                  <span className={badgeClass(tx.valueEth)}>{badgeLabel(tx.valueEth)}</span>
                  <span className="whale-time">{timeAgo(tx.timestamp)}</span>
                  <span className="whale-block">#{tx.blockNumber.toLocaleString()}</span>
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-btn"
                  >
                    Etherscan ↗
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
