import React, { useState, useMemo } from 'react';
import { Header } from './Header';
import { StatsCards } from './StatsCards';
import { WhalesFeed } from './WhalesFeed';
import { Charts } from './Charts';
import { TopWhales } from './TopWhales';
import { Filters } from './Filters';
import { useWebSocket } from '../hooks/useWebSocket';

export const Dashboard: React.FC = () => {
  // ✅ RETIRE l'argument BACKEND_URL
  const { transactions, stats, connection, connectedClients } = useWebSocket();

  const [minValue, setMinValue] = useState<number>(10);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [activeTab, setActiveTab] = useState<'feed' | 'analytics'>('feed');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const value = parseFloat(tx.value);
      if (value < minValue) return false;

      const now = Date.now();
      const txTime = tx.timestamp;
      const ranges = { '1h': 3600000, '24h': 86400000, '7d': 604800000 };

      return (now - txTime) <= ranges[timeRange];
    });
  }, [transactions, minValue, timeRange]);

  const topWhales = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
      .slice(0, 10);
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header connection={connection} connectedClients={connectedClients} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <StatsCards stats={stats} />

        <Filters
          minValue={minValue}
          timeRange={timeRange}
          onMinValueChange={setMinValue}
          onTimeRangeChange={setTimeRange}
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === 'feed'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🐋 Live Feed
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📊 Analytics
            </button>
          </div>
        </div>

        {activeTab === 'feed' ? (
          <WhalesFeed transactions={filteredTransactions} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Charts transactions={filteredTransactions} timeRange={timeRange} />
            <TopWhales whales={topWhales} />
          </div>
        )}
      </main>
    </div>
  );
};
