import { useRef, useEffect, useState } from 'react';
import { Transaction } from '../hooks/useWebSocket';
import { useLikes } from '../hooks/useLikes';
import { lookupAddress } from '../utils/knownAddresses';
import { NetworkInfo } from './NetworkSelector';

interface Props {
  transactions: Transaction[];
  ethPrice: number;
  newestHash: string | null;
  onAddressClick: (address: string) => void;
  networks: NetworkInfo[];
  range: string;
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
  if (eth >= 500)  return 'amount-xl';
  return 'amount-lg';
}
function badgeClass(eth: number) {
  if (eth >= 1000) return 'size-badge badge-xxl';
  if (eth >= 500)  return 'size-badge badge-xl';
  return 'size-badge badge-lg';
}
function badgeLabel(eth: number) {
  if (eth >= 1000) return 'Massive';
  if (eth >= 500)  return 'Very large';
  return 'Large';
}
function fmtAmount(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 10_000)    return `${(v / 1_000).toFixed(1)}K`;
  return v >= 10 ? v.toFixed(2) : v.toFixed(4);
}

function exportCsv(transactions: Transaction[], networkName: string) {
  const header = 'hash,blockNumber,from,to,valueNative,valueEur,network,timestamp\n';
  const rows = transactions
    .map((tx) =>
      `${tx.hash},${tx.blockNumber},${tx.from},${tx.to},${tx.valueEth},${tx.valueUsd},${tx.network},${new Date(tx.timestamp).toISOString()}`
    )
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whale-txs-${networkName}-${Date.now()}.csv`;
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

// Static fallback so Bitcoin/ETH links work even before the API fetch completes
const EXPLORER_FALLBACK: Record<string, string> = {
  'eth-mainnet': 'https://etherscan.io',
  'bitcoin': 'https://mempool.space',
};

export function WhalesFeed({ transactions, ethPrice, newestHash, onAddressClick, networks, range }: Props) {
  const networkMap = Object.fromEntries(networks.map((n) => [n.id, n]));
  const listRef = useRef<HTMLDivElement>(null);
  const { likedHashes, toggleLike } = useLikes();
  const [showLikedOnly, setShowLikedOnly] = useState(false);

  // Scroll to top when the time filter changes
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [range]);

  const displayedTxs = showLikedOnly
    ? transactions.filter((tx) => likedHashes.has(tx.hash))
    : transactions;

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">
          Recent whale transactions
          <span className="section-count">{displayedTxs.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className={`like-filter-btn${showLikedOnly ? ' active' : ''}`}
            onClick={() => setShowLikedOnly((v) => !v)}
            title={showLikedOnly ? 'Show all' : 'Show liked only'}
          >
            ♥{likedHashes.size > 0 ? ` ${likedHashes.size}` : ''}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>live</span>
          {transactions.length > 0 && (
            <button className="export-btn" onClick={() => exportCsv(transactions, transactions[0]?.network ?? 'crypto')} title="Export CSV">
              ↓ CSV
            </button>
          )}
        </div>
      </div>

      <div className="whale-list" ref={listRef}>
        {displayedTxs.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🐋</div>
            <p>{showLikedOnly ? 'No liked whales yet — click ♡ on a transaction to save it.' : 'Watching for large transactions…'}</p>
          </div>
        ) : (
          displayedTxs.map((tx) => {
            const usd = tx.valueUsd > 0 ? tx.valueUsd : tx.valueEth * ethPrice;
            const toLabel   = lookupAddress(tx.to);
            const fromLabel = lookupAddress(tx.from);
            const arrowColor = toLabel?.type === 'exchange'
              ? 'var(--red)'
              : fromLabel?.type === 'exchange'
              ? 'var(--green)'
              : 'var(--text-3)';

            const net = networkMap[tx.network];
            const symbol = net?.symbol ?? 'ETH';
            const explorerBase = net?.explorer ?? EXPLORER_FALLBACK[tx.network] ?? 'https://etherscan.io';
            const explorerLabel = net ? net.name.replace(' Mainnet', '') : 'Explorer';
            const liked = likedHashes.has(tx.hash);

            return (
              <div key={tx.hash} className={`whale-item${tx.hash === newestHash ? ' new-entry' : ''}`}>
                <div>
                  <div className={`whale-amount ${amountClass(tx.valueEth)}`}>
                    {fmtAmount(tx.valueEth)} {symbol}
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
                  <button
                    className={`like-btn${liked ? ' liked' : ''}`}
                    onClick={() => toggleLike(tx.hash)}
                    title={liked ? 'Unlike' : 'Like this whale'}
                  >
                    {liked ? '♥' : '♡'}
                  </button>
                  <a
                    href={`${explorerBase}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-btn"
                  >
                    {explorerLabel} ↗
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
