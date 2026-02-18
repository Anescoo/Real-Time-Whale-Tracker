import React from 'react';
import { WhaleCard } from './WhaleCard';
import { Transaction } from '../hooks/useWebSocket';

interface WhalesFeedProps {
  transactions: Transaction[];
}

export const WhalesFeed: React.FC<WhalesFeedProps> = ({ transactions }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        🐋 Recent Whale Transactions
      </h2>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Waiting for whale transactions...
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <WhaleCard key={transaction.hash} transaction={transaction} />
          ))}
        </div>
      )}
    </div>
  );
};
