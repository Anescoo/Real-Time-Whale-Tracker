import { useState, useMemo, useEffect, useRef } from 'react';
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
  const [selectedNetwork, setSelectedNetwork] = useState<string>(
    () => localStorage.getItem('whale-selected-network') ?? 'eth-mainnet'
  );
  const [networks, setNetworks] = useState<NetworkInfo[]>([
    { id: 'eth-mainnet', name: 'Ethereum', symbol: 'ETH', color: '#627eea', explorer: 'https://etherscan.io', provider: 'alchemy', threshold: 100, sliderMin: 100, sliderMax: 2000, sliderStep: 100 },
    { id: 'bitcoin',     name: 'Bitcoin',  symbol: 'BTC', color: '#f7931a', explorer: 'https://mempool.space',   provider: 'mempool', threshold: 50,  sliderMin: 50,  sliderMax: 1000, sliderStep: 50 },
  ]);
  const { transactions, stats, ethPrice, status, connectedClients, newestHash } = useWebSocket(selectedNetwork);
  const [range, setRange]                     = useState<TimeRange>('1h');
  const [minEth, setMinEth]                   = useState(100);
  const [selectedAddr, setSelectedAddr]       = useState<string | null>(null);
  const [todayCount, setTodayCount]           = useState<number | null>(null);
  const prevNewestHashRef                     = useRef<string | null>(null);

  // Fetch network list from backend once on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/networks`)
      .then((r) => r.json())
      .then((data: NetworkInfo[]) => setNetworks(data))
      .catch(() => { /* backend may not be ready yet */ });
  }, []);

  // Fetch today's whale count from DB (exact count since midnight, no limit)
  useEffect(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sinceMs = startOfToday.getTime();

    setTodayCount(null); // reset while loading
    fetch(`${BACKEND_URL}/api/whales/count?since=${sinceMs}&network=${selectedNetwork}`)
      .then((r) => r.json())
      .then((data: { count: number }) => setTodayCount(data.count))
      .catch(() => {});
  }, [selectedNetwork]);

  // Increment todayCount when a new whale is detected live (avoid refetching)
  useEffect(() => {
    if (transactions.length === 0) return;
    const newest = transactions[0];
    if (newest.hash === prevNewestHashRef.current) return;
    prevNewestHashRef.current = newest.hash;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (newest.network === selectedNetwork && newest.timestamp >= startOfToday.getTime()) {
      setTodayCount((prev) => (prev !== null ? prev + 1 : null));
    }
  }, [transactions, selectedNetwork]);

  const currentNetwork = networks.find((n) => n.id === selectedNetwork);

  const filtered = useMemo(() => {
    const cutoff = RANGE_MS[range] === Infinity ? 0 : Date.now() - RANGE_MS[range];
    return transactions.filter(
      (tx) => tx.timestamp >= cutoff && tx.valueEth >= minEth && tx.network === selectedNetwork
    );
  }, [transactions, range, minEth, selectedNetwork]);

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
        <StatsCards stats={stats} transactions={filtered} todayCount={todayCount} />

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
            localStorage.setItem('whale-selected-network', id);
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
            range={range}
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
          networks={networks}
        />
      )}
    </>
  );
}
