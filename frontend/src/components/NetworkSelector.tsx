import { useState, useRef, useEffect } from 'react';

export interface NetworkInfo {
  id: string;
  name: string;
  symbol: string;
  color: string;
  explorer: string;
  provider: 'alchemy' | 'mempool' | 'coming_soon';
  threshold: number;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
}

interface Props {
  networks: NetworkInfo[];
  selected: string;
  onChange: (networkId: string) => void;
}

export function NetworkSelector({ networks, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = networks.find((n) => n.id === selected) ?? networks[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="network-selector" ref={ref}>
      <button
        className="network-selector-btn"
        onClick={() => setOpen((v) => !v)}
        title="Select network"
      >
        <span className="network-dot" style={{ background: current?.color }} />
        <span className="network-name">{current?.name ?? 'Ethereum'}</span>
        <span className="network-symbol">{current?.symbol}</span>
        <span className="network-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="network-dropdown">
          {networks.map((net) => {
            const disabled = net.provider === 'coming_soon';
            return (
              <button
                key={net.id}
                className={`network-option${net.id === selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    onChange(net.id);
                    setOpen(false);
                  }
                }}
              >
                <span className="network-dot" style={{ background: net.color }} />
                <span className="network-option-name">{net.name}</span>
                <span className="network-option-symbol">{net.symbol}</span>
                {disabled && <span className="network-soon">Soon</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
