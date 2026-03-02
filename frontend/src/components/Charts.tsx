import { useMemo } from 'react';
import { Transaction } from '../hooks/useWebSocket';
import { TimeRange } from './Filters';

interface Props {
  transactions: Transaction[];
  range: TimeRange;
}

const BUCKET_CONFIG: Record<TimeRange, { count: number; ms: number; fmt: (t: number) => string }> = {
  '1min':  { count: 12, ms: 5_000,       fmt: (t) => `${new Date(t).getSeconds()}s` },
  '5min':  { count: 10, ms: 30_000,      fmt: (t) => `${new Date(t).getMinutes()}:${String(new Date(t).getSeconds()).padStart(2, '0')}` },
  '10min': { count: 10, ms: 60_000,      fmt: (t) => `${new Date(t).getMinutes()}m` },
  '15min': { count: 15, ms: 60_000,      fmt: (t) => `${new Date(t).getMinutes()}m` },
  '1h':    { count: 12, ms: 5 * 60_000,  fmt: (t) => `${new Date(t).getMinutes()}m` },
  '6h':    { count: 12, ms: 30 * 60_000, fmt: (t) => `${new Date(t).getHours()}:00` },
  '24h':   { count: 24, ms: 60 * 60_000, fmt: (t) => `${new Date(t).getHours()}h` },
  'all':   { count: 12, ms: 60 * 60_000, fmt: (t) => `${new Date(t).getHours()}h` },
};

interface Point { x: number; y: number; volume: number; count: number; label: string; }

/**
 * Monotone cubic interpolation (Fritsch-Carlson).
 * Unlike symmetric bezier, this never overshoots — flat zero regions stay flat,
 * and peaks don't create artificial sine-wave shapes.
 */
function monotonePath(pts: Point[]): string {
  const n = pts.length;
  if (n < 2) return '';

  // Slopes between consecutive points
  const d = pts.slice(0, -1).map((p, i) =>
    (pts[i + 1].y - p.y) / (pts[i + 1].x - p.x)
  );

  // Tangents at each point
  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  }

  // Fritsch-Carlson monotonicity conditions
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i];
    const t2 = a * a + b * b;
    if (t2 > 9) {
      const s = 3 / Math.sqrt(t2);
      m[i] = s * a * d[i];
      m[i + 1] = s * b * d[i];
    }
  }

  // Build cubic bezier path
  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = pts[i + 1].x - pts[i].x;
    const cp1x = (pts[i].x + h / 3).toFixed(1);
    const cp1y = (pts[i].y + (m[i] * h) / 3).toFixed(1);
    const cp2x = (pts[i + 1].x - h / 3).toFixed(1);
    const cp2y = (pts[i + 1].y - (m[i + 1] * h) / 3).toFixed(1);
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
  }
  return path;
}

function areaPath(pts: Point[], bottom: number): string {
  if (pts.length < 2) return '';
  const last = pts[pts.length - 1];
  return `${monotonePath(pts)} L ${last.x.toFixed(1)} ${bottom} L ${pts[0].x.toFixed(1)} ${bottom} Z`;
}

export function Charts({ transactions, range }: Props) {
  const { buckets, maxVol } = useMemo(() => {
    const cfg = BUCKET_CONFIG[range];
    const now = Date.now();
    const buckets = Array.from({ length: cfg.count }, (_, i) => {
      const end = now - i * cfg.ms;
      const start = end - cfg.ms;
      const txs = transactions.filter((t) => t.timestamp >= start && t.timestamp < end);
      return {
        label: cfg.fmt(start),
        volume: txs.reduce((s, t) => s + t.valueEth, 0),
        count: txs.length,
      };
    }).reverse();
    const maxVol = Math.max(...buckets.map((b) => b.volume), 1);
    return { buckets, maxVol };
  }, [transactions, range]);

  const totalVol = buckets.reduce((s, b) => s + b.volume, 0);
  const totalTx  = buckets.reduce((s, b) => s + b.count, 0);

  // SVG layout
  const VW = 600, VH = 200;
  const PT = 16, PB = 30, PL = 6, PR = 6;
  const plotW = VW - PL - PR;
  const plotH = VH - PT - PB;
  const bottom = PT + plotH;

  const points: Point[] = buckets.map((b, i) => ({
    x: PL + (buckets.length > 1 ? (i / (buckets.length - 1)) * plotW : plotW / 2),
    y: PT + plotH - (b.volume / maxVol) * plotH,
    ...b,
  }));

  const linePath = monotonePath(points);
  const fillPath = areaPath(points, bottom);
  const labelEvery = Math.ceil(buckets.length / 8);

  return (
    <div className="charts-section">
      <div className="section-header">
        <div className="section-title">Volume distribution</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>
            {totalVol.toFixed(0)} ETH
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>
            {totalTx} txs
          </span>
        </div>
      </div>

      <div className="chart-inner">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="line-chart-svg"
          aria-label="Whale volume distribution chart"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Guide lines at 25 / 50 / 75% */}
          {[0.25, 0.5, 0.75].map((pct, i) => (
            <line
              key={i}
              x1={PL} y1={(PT + plotH - pct * plotH).toFixed(1)}
              x2={VW - PR} y2={(PT + plotH - pct * plotH).toFixed(1)}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          ))}

          {/* Baseline */}
          <line x1={PL} y1={bottom} x2={VW - PR} y2={bottom} stroke="var(--border-2)" strokeWidth="1" />

          {/* Area fill */}
          {totalVol > 0 && <path d={fillPath} fill="url(#areaGrad)" />}

          {/* Line */}
          {totalVol > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots with tooltip */}
          {points.map((p, i) =>
            p.volume > 0 ? (
              <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="var(--accent)">
                <title>{`${p.volume.toFixed(1)} ETH · ${p.count} tx`}</title>
              </circle>
            ) : null
          )}

          {/* X-axis labels */}
          {points.map((p, i) => {
            if (i % labelEvery !== 0 && i !== points.length - 1) return null;
            return (
              <text
                key={`lbl-${i}`}
                x={p.x.toFixed(1)}
                y={VH - 4}
                textAnchor="middle"
                fill="var(--text-3)"
                fontSize="9"
                fontFamily="var(--mono)"
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
