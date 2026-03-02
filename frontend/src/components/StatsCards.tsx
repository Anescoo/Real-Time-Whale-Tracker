import { Stats } from '../hooks/useWebSocket';

interface Props { stats: Stats; }

function fmt(n: number, decimals = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

export function StatsCards({ stats }: Props) {
  const cards = [
    {
      label: 'Whales detected',
      value: fmt(stats.whalesDetected),
      sub: `${stats.last24hCount} in the last 24h`,
      accent: '#06b6d4',
    },
    {
      label: 'Total volume',
      value: `${fmt(stats.totalVolumeEth, 1)} ETH`,
      sub: stats.totalVolumeUsd > 0 ? `$${fmt(stats.totalVolumeUsd)}` : '—',
      accent: '#22c55e',
    },
    {
      label: 'Largest transaction',
      value: `${fmt(stats.largestTransactionEth, 1)} ETH`,
      sub: stats.largestTransactionEth > 0 && stats.ethPrice > 0
        ? `$${fmt(stats.largestTransactionEth * stats.ethPrice)}`
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
