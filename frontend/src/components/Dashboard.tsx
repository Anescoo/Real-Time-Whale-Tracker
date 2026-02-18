import React from 'react';
import { Header } from './Header';
import { StatsCards } from './StatsCards';
import { WhalesFeed } from './WhalesFeed';
import { useWebSocket } from '../hooks/useWebSocket';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const Dashboard: React.FC = () => {
  const { transactions, stats, connection, connectedClients } = useWebSocket(BACKEND_URL);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header connection={connection} connectedClients={connectedClients} />
      
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <StatsCards stats={stats} />
        <WhalesFeed transactions={transactions} />
      </main>
    </div>
  );
};
