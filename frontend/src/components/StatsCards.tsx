import { Stats, Transaction } from '../hooks/useWebSocket';

interface Props {
  stats: Stats;
  transactions: Transaction[];
}

function fmt(n: number, decimals = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

export function StatsCards({ stats, transactions }: Props) {
  const filteredCount  = transactions.length;
  const filteredVolEth = transactions.reduce((s, t) => s + t.valueEth, 0);
  const filteredVolEur = transactions.reduce((s, t) => s + (t.valueUsd > 0 ? t.valueUsd : t.valueEth * stats.ethPrice), 0);
  const filteredLargest = transactions.length > 0
    ? Math.max(...transactions.map((t) => t.valueEth))
    : 0;
  const filteredLargestEur = filteredLargest * stats.ethPrice;

  const cards = [
    {
      label: 'Whales detected',
      value: fmt(filteredCount),
      sub: `${stats.last24hCount} in the last 24h`,
      accent: '#06b6d4',
    },
    {
      label: 'Total volume',
      value: `${fmt(filteredVolEth, 1)} ETH`,
      sub: filteredVolEur > 0 ? `€${fmt(filteredVolEur)}` : '—',
      accent: '#22c55e',
    },
    {
      label: 'Largest transaction',
      value: `${fmt(filteredLargest, 1)} ETH`,
      sub: filteredLargest > 0 && stats.ethPrice > 0
        ? `€${fmt(filteredLargestEur)}`
        : '—',
      accent: '#f59e0b',
    },
    {
      label: 'Blocks scanned',
      value: fmt(stats.blocksProcessed),
      sub: `Threshold: ${stats.whaleThreshold} ETH`,
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
