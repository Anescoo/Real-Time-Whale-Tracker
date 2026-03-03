import { useMemo } from 'react';
import { Transaction } from '../hooks/useWebSocket';
import { TimeRange } from './Filters';

interface Props {
  transactions: Transaction[];
  range: TimeRange;
  symbol: string;
  threshold: number;
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
 */
function monotonePath(pts: Point[]): string {
  const n = pts.length;
  if (n < 2) return '';

  const d = pts.slice(0, -1).map((p, i) =>
    (pts[i + 1].y - p.y) / (pts[i + 1].x - p.x)
  );

  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  }

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

/* ── Amount-distribution histogram ── */
const BUCKET_COLORS = ['#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];
const BUCKET_MULT   = [1, 2, 5, 10, 50]; // multiples of threshold

function fmtLabel(v: number): string {
  if (v >= 1_000_000) return `${v % 1_000_000 === 0 ? (v / 1_000_000).toFixed(0) : (v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${v % 1_000 === 0     ? (v / 1_000).toFixed(0)     : (v / 1_000).toFixed(1)}K`;
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
}

function buildDistBuckets(threshold: number) {
  return BUCKET_MULT.map((m, i) => {
    const min   = threshold * m;
    const max   = i < BUCKET_MULT.length - 1 ? threshold * BUCKET_MULT[i + 1] : Infinity;
    const label = max === Infinity ? `${fmtLabel(min)}+` : `${fmtLabel(min)}–${fmtLabel(max)}`;
    return { label, min, max, color: BUCKET_COLORS[i] };
  });
}

function AmountHistogram({ transactions, symbol, threshold }: { transactions: Transaction[]; symbol: string; threshold: number }) {
  const distBuckets = buildDistBuckets(threshold);
  const buckets = distBuckets.map((b) => ({
    ...b,
    count: transactions.filter((t) => t.valueEth >= b.min && t.valueEth < b.max).length,
  }));
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const total    = buckets.reduce((s, b) => s + b.count, 0);

  // SVG layout
  const VW = 400, VH = 200;
  const PT = 16, PB = 30, PL = 24, PR = 8;
  const plotW = VW - PL - PR;
  const plotH = VH - PT - PB;
  const bottom = PT + plotH;
  const slotW  = plotW / buckets.length;
  const barW   = slotW * 0.6;

  return (
    <div className="charts-section">
      <div className="section-header">
        <div className="section-title">Size distribution</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>
            {total} txs
          </span>
        </div>
      </div>

      <div className="chart-inner">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="line-chart-svg"
          aria-label="Transaction size distribution"
        >
          {/* Guide lines */}
          {[0.25, 0.5, 0.75, 1].map((pct, i) => (
            <line
              key={i}
              x1={PL} y1={(bottom - pct * plotH).toFixed(1)}
              x2={VW - PR} y2={(bottom - pct * plotH).toFixed(1)}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          ))}

          {/* Baseline */}
          <line x1={PL} y1={bottom} x2={VW - PR} y2={bottom} stroke="var(--border-2)" strokeWidth="1" />

          {/* Bars */}
          {buckets.map((b, i) => {
            const barH  = (b.count / maxCount) * plotH;
            const barX  = PL + i * slotW + (slotW - barW) / 2;
            const barY  = bottom - barH;
            const labelX = PL + i * slotW + slotW / 2;

            return (
              <g key={b.label}>
                {b.count > 0 && (
                  <>
                    <rect
                      x={barX.toFixed(1)} y={barY.toFixed(1)}
                      width={barW.toFixed(1)} height={Math.max(barH, 2).toFixed(1)}
                      rx="3" ry="3"
                      fill={b.color}
                      opacity="0.75"
                    >
                      <title>{`${b.label} ${symbol}: ${b.count} tx`}</title>
                    </rect>
                    {/* Count label on bar */}
                    <text
                      x={labelX.toFixed(1)}
                      y={(barY - 4).toFixed(1)}
                      textAnchor="middle"
                      fill={b.color}
                      fontSize="9"
                      fontFamily="var(--mono)"
                      fontWeight="600"
                    >
                      {b.count}
                    </text>
                  </>
                )}
                {/* X label */}
                <text
                  x={labelX.toFixed(1)}
                  y={VH - 4}
                  textAnchor="middle"
                  fill="var(--text-3)"
                  fontSize="9"
                  fontFamily="var(--mono)"
                >
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ── Volume-over-time line chart ── */
export function Charts({ transactions, range, symbol, threshold }: Props) {
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
    <div className="charts-row">
      {/* ── Line chart: volume over time ── */}
      <div className="charts-section">
        <div className="section-header">
          <div className="section-title">Volume over time</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>
              {totalVol.toFixed(0)} {symbol}
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

            <line x1={PL} y1={bottom} x2={VW - PR} y2={bottom} stroke="var(--border-2)" strokeWidth="1" />

            {totalVol > 0 && <path d={fillPath} fill="url(#areaGrad)" />}

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

            {points.map((p, i) =>
              p.volume > 0 ? (
                <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="var(--accent)">
                  <title>{`${p.volume.toFixed(1)} ${symbol} · ${p.count} tx`}</title>
                </circle>
              ) : null
            )}

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

      {/* ── Histogram: transaction size distribution ── */}
      <AmountHistogram transactions={transactions} symbol={symbol} threshold={threshold} />
    </div>
  );
}
