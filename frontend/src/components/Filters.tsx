import { useState, useEffect } from 'react';
import { NetworkSelector, NetworkInfo } from './NetworkSelector';

export type TimeRange = '1min' | '5min' | '10min' | '15min' | '1h' | '6h' | '24h' | 'all';

interface Props {
  range: TimeRange;
  minEth: number;
  onRangeChange: (r: TimeRange) => void;
  onMinEthChange: (n: number) => void;
  networks: NetworkInfo[];
  selectedNetwork: string;
  onNetworkChange: (id: string) => void;
  symbol: string;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: '1m',  value: '1min' },
  { label: '5m',  value: '5min' },
  { label: '10m', value: '10min' },
  { label: '15m', value: '15min' },
  { label: '1h',  value: '1h' },
  { label: '6h',  value: '6h' },
  { label: '24h', value: '24h' },
  { label: 'All', value: 'all' },
];

export function Filters({ range, minEth, onRangeChange, onMinEthChange, networks, selectedNetwork, onNetworkChange, symbol, sliderMin, sliderMax, sliderStep }: Props) {
  const [sliderVal, setSliderVal] = useState(minEth);

  // Sync local slider when parent resets minEth (e.g. on network switch)
  useEffect(() => { setSliderVal(minEth); }, [minEth]);

  const handleSlider = (v: number) => {
    setSliderVal(v);
    onMinEthChange(v);
  };

  return (
    <div className="filters">
      {networks.length > 0 && (
        <>
          <NetworkSelector networks={networks} selected={selectedNetwork} onChange={onNetworkChange} />
          <div className="filter-separator" />
        </>
      )}

      <span className="filters-label">Period</span>
      {RANGES.map((r) => (
        <button
          key={r.value}
          className={`filter-btn${range === r.value ? ' active' : ''}`}
          onClick={() => onRangeChange(r.value)}
        >
          {r.label}
        </button>
      ))}

      <div className="filter-separator" />

      <span className="filters-label">Min</span>
      <div className="filter-amount">
        <input
          type="range"
          className="filter-range"
          min={sliderMin} max={sliderMax} step={sliderStep}
          value={sliderVal}
          onChange={(e) => handleSlider(Number(e.target.value))}
        />
        <span className="filter-amount-value">{sliderVal} {symbol}</span>
      </div>
    </div>
  );
}
