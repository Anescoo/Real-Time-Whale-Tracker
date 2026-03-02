import { useMemo } from 'react';
import { Transaction } from '../hooks/useWebSocket';
import { lookupAddress } from '../utils/knownAddresses';

interface Props {
  transactions: Transaction[];
}

export function WhaleFlow({ transactions }: Props) {
  const { inflow, outflow } = useMemo(() => {
    let inflow = 0;   // wallet → exchange  (selling pressure)
    let outflow = 0;  // exchange → wallet  (accumulation)

    for (const tx of transactions) {
      if (lookupAddress(tx.to)?.type === 'exchange') inflow += tx.valueEth;
      if (lookupAddress(tx.from)?.type === 'exchange') outflow += tx.valueEth;
    }
    return { inflow, outflow };
  }, [transactions]);

  const total = inflow + outflow;
  if (total === 0) return null;

  const outPct = Math.round((outflow / total) * 100);
  const inPct = 100 - outPct;

  let signal: 'bullish' | 'bearish' | 'neutral';
  if (inflow > outflow * 1.4) signal = 'bearish';
  else if (outflow > inflow * 1.4) signal = 'bullish';
  else signal = 'neutral';

  const signalMeta = {
    bullish: { label: '↑ Accumulation', color: 'var(--green)' },
    bearish: { label: '↓ Distribution', color: 'var(--red)' },
    neutral: { label: '↔ Mixed signals', color: 'var(--amber)' },
  }[signal];

  function fmtEth(v: number) {
    return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0);
  }

  return (
    <div className="whale-flow">
      <div className="whale-flow-header">
        <span className="whale-flow-title">Exchange flow</span>
        <span className="whale-flow-signal" style={{ color: signalMeta.color }}>
          {signalMeta.label}
        </span>
      </div>

      <div className="whale-flow-body">
        <div className="whale-flow-side">
          <div className="whale-flow-eth" style={{ color: 'var(--green)' }}>{fmtEth(outflow)} ETH</div>
          <div className="whale-flow-label">Outflow (buy)</div>
        </div>

        <div className="whale-flow-bar-wrap">
          <div className="whale-flow-bar">
            <div className="wf-seg wf-out" style={{ width: `${outPct}%` }} title={`${outPct}% outflow`} />
            <div className="wf-seg wf-in"  style={{ width: `${inPct}%` }}  title={`${inPct}% inflow`} />
          </div>
          <div className="whale-flow-pcts">
            <span style={{ color: 'var(--green)' }}>{outPct}%</span>
            <span style={{ color: 'var(--text-3)', fontSize: 9 }}>exchanges</span>
            <span style={{ color: 'var(--red)' }}>{inPct}%</span>
          </div>
        </div>

        <div className="whale-flow-side whale-flow-side-r">
          <div className="whale-flow-eth" style={{ color: 'var(--red)' }}>{fmtEth(inflow)} ETH</div>
          <div className="whale-flow-label">Inflow (sell)</div>
        </div>
      </div>
    </div>
  );
}
