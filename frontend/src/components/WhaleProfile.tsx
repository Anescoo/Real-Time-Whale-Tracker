import { useMemo } from 'react';
import { Transaction } from '../hooks/useWebSocket';
import { lookupAddress } from '../utils/knownAddresses';
import { NetworkInfo } from './NetworkSelector';

const EXPLORER_FALLBACK: Record<string, string> = {
  'eth-mainnet': 'https://etherscan.io',
  'bitcoin': 'https://mempool.space',
};

interface Props {
  address: string;
  allTransactions: Transaction[];
  ethPrice: number;
  onClose: () => void;
  networks: NetworkInfo[];
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtEth(v: number) {
  return v >= 10000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(2);
}

function amountClass(eth: number) {
  if (eth >= 1000) return 'amount-xxl';
  if (eth >= 500) return 'amount-xl';
  return 'amount-lg';
}

export function WhaleProfile({ address, allTransactions, ethPrice, onClose, networks }: Props) {
  const label = lookupAddress(address);

  const { sent, received, totalSent, totalReceived } = useMemo(() => {
    const addr = address.toLowerCase();
    const sent = allTransactions.filter((tx) => tx.from.toLowerCase() === addr);
    const received = allTransactions.filter((tx) => tx.to.toLowerCase() === addr);
    const totalSent = sent.reduce((s, tx) => s + tx.valueEth, 0);
    const totalReceived = received.reduce((s, tx) => s + tx.valueEth, 0);
    return { sent, received, totalSent, totalReceived };
  }, [address, allTransactions]);

  const txs = useMemo(
    () =>
      [...sent, ...received].sort((a, b) => b.timestamp - a.timestamp),
    [sent, received]
  );

  const netEth = totalReceived - totalSent;
  const usdValue = (Math.abs(netEth) * ethPrice);

  // Detect the network from this address's transactions
  const networkId = txs[0]?.network ?? 'eth-mainnet';
  const net = networks.find((n) => n.id === networkId);
  const explorerBase = net?.explorer ?? EXPLORER_FALLBACK[networkId] ?? 'https://etherscan.io';
  const explorerLabel = net ? net.name.replace(' Mainnet', '') : 'Explorer';
  const symbol = net?.symbol ?? 'ETH';

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="profile-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {label && (
                <span className={`known-badge known-badge-${label.type}`}>{label.name}</span>
              )}
              <span className="profile-addr">
                {address.slice(0, 10)}…{address.slice(-8)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <a
                href={`${explorerBase}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-btn"
                style={{ fontSize: 10 }}
              >
                {explorerLabel} ↗
              </a>
              <button
                className="link-btn"
                style={{ fontSize: 10, cursor: 'pointer' }}
                onClick={() => navigator.clipboard?.writeText(address)}
              >
                Copy address
              </button>
            </div>
          </div>
          <button className="profile-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Stats summary */}
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-label">Sent (session)</div>
            <div className="profile-stat-val" style={{ color: 'var(--red)' }}>
              {fmtEth(totalSent)} {symbol}
            </div>
            <div className="profile-stat-sub">{sent.length} tx</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-label">Received (session)</div>
            <div className="profile-stat-val" style={{ color: 'var(--green)' }}>
              {fmtEth(totalReceived)} {symbol}
            </div>
            <div className="profile-stat-sub">{received.length} tx</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-label">Net position</div>
            <div
              className="profile-stat-val"
              style={{ color: netEth >= 0 ? 'var(--green)' : 'var(--red)' }}
            >
              {netEth >= 0 ? '+' : ''}{fmtEth(netEth)} {symbol}
            </div>
            {ethPrice > 0 && (
              <div className="profile-stat-sub">
                ≈ €{(usdValue / 1e6).toFixed(2)}M
              </div>
            )}
          </div>
        </div>

        {/* Transaction list */}
        <div className="profile-txlist">
          <div className="profile-txlist-title">Transactions this session ({txs.length})</div>
          {txs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              No transactions in current window
            </div>
          ) : (
            txs.map((tx) => {
              const isSend = tx.from.toLowerCase() === address.toLowerCase();
              const peer = isSend ? tx.to : tx.from;
              const peerLabel = lookupAddress(peer);
              const usd = tx.valueUsd > 0 ? tx.valueUsd : tx.valueEth * ethPrice;
              return (
                <div key={tx.hash} className="profile-tx">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      className="profile-tx-dir"
                      style={{ color: isSend ? 'var(--red)' : 'var(--green)' }}
                    >
                      {isSend ? '↑ Sent' : '↓ Recv'}
                    </span>
                    <span className={`profile-tx-eth ${amountClass(tx.valueEth)}`}>
                      {fmtEth(tx.valueEth)} {symbol}
                    </span>
                    {usd > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                        €{usd >= 1e6
                          ? `${(usd / 1e6).toFixed(2)}M`
                          : usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                  <div className="profile-tx-peer">
                    {isSend ? 'to ' : 'from '}
                    {peerLabel ? (
                      <span className={`known-badge known-badge-${peerLabel.type}`} style={{ fontSize: 9 }}>
                        {peerLabel.name}
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>
                        {peer.slice(0, 8)}…{peer.slice(-6)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                      {timeAgo(tx.timestamp)} · #{tx.blockNumber.toLocaleString()}
                    </span>
                    <a
                      href={`${explorerBase}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-btn"
                      style={{ fontSize: 9, padding: '1px 5px' }}
                    >
                      ↗
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
