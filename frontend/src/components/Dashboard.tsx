import { useState, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Header } from './Header';
import { StatsCards } from './StatsCards';
import { Filters, TimeRange } from './Filters';
import { WhalesFeed } from './WhalesFeed';
import { TopWhales } from './TopWhales';
import { Charts } from './Charts';
import { WhaleFlow } from './WhaleFlow';
import { WhaleProfile } from './WhaleProfile';

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

export function Dashboard() {
  const { transactions, stats, ethPrice, status, connectedClients, newestHash } = useWebSocket();
  const [range, setRange]               = useState<TimeRange>('1h');
  const [minEth, setMinEth]             = useState(100);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const cutoff = RANGE_MS[range] === Infinity ? 0 : Date.now() - RANGE_MS[range];
    return transactions.filter(
      (tx) => tx.timestamp >= cutoff && tx.valueEth >= minEth
    );
  }, [transactions, range, minEth]);

  return (
    <>
      <Header status={status} connectedClients={connectedClients} ethPrice={ethPrice} />

      <main className="main">
        <StatsCards stats={stats} transactions={filtered} />

        <WhaleFlow transactions={filtered} />

        <Filters
          range={range}
          minEth={minEth}
          onRangeChange={setRange}
          onMinEthChange={setMinEth}
        />

        <div className="content-grid">
          <WhalesFeed
            transactions={filtered}
            ethPrice={ethPrice}
            newestHash={newestHash}
            onAddressClick={setSelectedAddr}
          />
          <TopWhales
            transactions={filtered}
            ethPrice={ethPrice}
            onAddressClick={setSelectedAddr}
          />
        </div>

        <Charts transactions={filtered} range={range} />
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
