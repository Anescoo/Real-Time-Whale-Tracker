import { Stats, Transaction } from '../hooks/useWebSocket';

interface Props {
  stats: Stats;
  transactions: Transaction[];
  todayCount: number | null;
}

function fmt(n: number, decimals = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

export function StatsCards({ stats, transactions, todayCount }: Props) {
  const sym = stats.symbol ?? 'ETH';
  const periodCount = transactions.length;
  const totalVolEur = stats.totalVolumeUsd > 0 ? stats.totalVolumeUsd : stats.totalVolumeEth * stats.ethPrice;
  const largestEur  = stats.largestTransactionEth * stats.ethPrice;

  const todayDisplay = todayCount !== null ? fmt(todayCount) : '…';

  const cards = [
    {
      label: 'Whales detected today',
      value: todayDisplay,
      sub: `${periodCount} in selected window`,
      accent: '#06b6d4',
    },
    {
      label: 'Total volume',
      value: `${fmt(stats.totalVolumeEth, 1)} ${sym}`,
      sub: totalVolEur > 0 ? `€${fmt(totalVolEur)}` : '—',
      accent: '#22c55e',
    },
    {
      label: 'Largest transaction',
      value: `${fmt(stats.largestTransactionEth, 1)} ${sym}`,
      sub: stats.largestTransactionEth > 0 && stats.ethPrice > 0
        ? `€${fmt(largestEur)}`
        : '—',
      accent: '#f59e0b',
    },
    {
      label: 'Blocks scanned',
      value: fmt(stats.blocksProcessed),
      sub: `Threshold: ${stats.whaleThreshold} ${sym}`,
      accent: '#a855f7',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((c) => (
        <div key={c.label} className="stat-card" style={{ '--card-accent': c.accent } as React.CSSProperties}>
          <div className="stat-label">{c.label}</div>
          <div className="stat-value">{c.value}</div>
          <div className="stat-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
