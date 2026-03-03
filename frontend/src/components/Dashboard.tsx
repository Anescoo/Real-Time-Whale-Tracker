import { useState, useMemo, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Header } from './Header';
import { StatsCards } from './StatsCards';
import { Filters, TimeRange } from './Filters';
import { WhalesFeed } from './WhalesFeed';
import { TopWhales } from './TopWhales';
import { Charts } from './Charts';
import { WhaleFlow } from './WhaleFlow';
import { WhaleProfile } from './WhaleProfile';
import { NetworkInfo } from './NetworkSelector';

const RANGE_MS: Record<TimeRange, number> = {
  '1min':  60_000,
  '5min':  5  * 60_000,
  '10min': 10 * 60_000,
  '15min': 15 * 60_000,
  '1h':    60 * 60_000,
  '6h':    6  * 60 * 60_000,
  '24h':   24 * 60 * 60_000,
  'all':   Infinity,
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export function Dashboard() {
  const [selectedNetwork, setSelectedNetwork] = useState('eth-mainnet');
  const [networks, setNetworks]               = useState<NetworkInfo[]>([
    { id: 'eth-mainnet', name: 'Ethereum', symbol: 'ETH', color: '#627eea', explorer: 'https://etherscan.io', provider: 'alchemy', threshold: 100, sliderMin: 100, sliderMax: 2000, sliderStep: 100 },
  ]);
  const { transactions, stats, ethPrice, status, connectedClients, newestHash } = useWebSocket(selectedNetwork);
  const [range, setRange]                     = useState<TimeRange>('1h');
  const [minEth, setMinEth]                   = useState(100);
  const [selectedAddr, setSelectedAddr]       = useState<string | null>(null);

  // Fetch network list from backend once on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/networks`)
      .then((r) => r.json())
      .then((data: NetworkInfo[]) => setNetworks(data))
      .catch(() => { /* backend may not be ready yet */ });
  }, []);

  const currentNetwork = networks.find((n) => n.id === selectedNetwork);

  const filtered = useMemo(() => {
    const cutoff = RANGE_MS[range] === Infinity ? 0 : Date.now() - RANGE_MS[range];
    return transactions.filter(
      (tx) => tx.timestamp >= cutoff && tx.valueEth >= minEth
    );
  }, [transactions, range, minEth]);

  return (
    <>
      <Header
        status={status}
        connectedClients={connectedClients}
        ethPrice={ethPrice}
        symbol={currentNetwork?.symbol ?? 'ETH'}
        networks={networks}
      />

      <main className="main">
        <StatsCards stats={stats} transactions={filtered} />

        <WhaleFlow transactions={filtered} />

        <Filters
          range={range}
          minEth={minEth}
          onRangeChange={setRange}
          onMinEthChange={setMinEth}
          networks={networks}
          selectedNetwork={selectedNetwork}
          onNetworkChange={(id) => {
            const net = networks.find((n) => n.id === id);
            setSelectedNetwork(id);
            setMinEth(net?.threshold ?? net?.sliderMin ?? 100);
          }}
          symbol={currentNetwork?.symbol ?? 'ETH'}
          sliderMin={currentNetwork?.sliderMin ?? 100}
          sliderMax={currentNetwork?.sliderMax ?? 2000}
          sliderStep={currentNetwork?.sliderStep ?? 100}
        />

        <div className="content-grid">
          <WhalesFeed
            transactions={filtered}
            ethPrice={ethPrice}
            newestHash={newestHash}
            onAddressClick={setSelectedAddr}
            networks={networks}
          />
          <TopWhales
            transactions={filtered}
            ethPrice={ethPrice}
            onAddressClick={setSelectedAddr}
            symbol={currentNetwork?.symbol ?? 'ETH'}
          />
        </div>

        <Charts
          transactions={filtered}
          range={range}
          symbol={currentNetwork?.symbol ?? 'ETH'}
          threshold={minEth}
        />
      </main>

      {selectedAddr && (
        <WhaleProfile
          address={selectedAddr}
          allTransactions={transactions}
          ethPrice={ethPrice}
          onClose={() => setSelectedAddr(null)}
        />
      )}
    </>
  );
}
