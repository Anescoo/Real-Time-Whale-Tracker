import React from 'react';
import { WhaleCard } from './WhaleCard';
import type { Transaction } from '../types/whale.types';

interface Props {
  transactions: Transaction[];
}

export const WhalesFeed: React.FC<Props> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <span className="text-6xl mb-4 block">🐋</span>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Waiting for whales...
        </h3>
        <p className="text-gray-500">
          Large transactions will appear here in real-time
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Recent Whale Transactions ({transactions.length})
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {transactions.map((tx) => (
          <WhaleCard key={tx.hash} transaction={tx} />
        ))}
      </div>
    </div>
  );
};
