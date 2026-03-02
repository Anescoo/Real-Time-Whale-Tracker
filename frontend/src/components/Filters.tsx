import { useState } from 'react';

export type TimeRange = '1min' | '5min' | '10min' | '15min' | '1h' | '6h' | '24h' | 'all';

interface Props {
  range: TimeRange;
  minEth: number;
  onRangeChange: (r: TimeRange) => void;
  onMinEthChange: (n: number) => void;
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

export function Filters({ range, minEth, onRangeChange, onMinEthChange }: Props) {
  const [sliderVal, setSliderVal] = useState(minEth);

  const handleSlider = (v: number) => {
    setSliderVal(v);
    onMinEthChange(v);
  };

  return (
    <div className="filters">
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
          min={100} max={2000} step={100}
          value={sliderVal}
          onChange={(e) => handleSlider(Number(e.target.value))}
        />
        <span className="filter-amount-value">{sliderVal} ETH</span>
      </div>
    </div>
  );
}
