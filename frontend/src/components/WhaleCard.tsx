import React from 'react';
import { Transaction } from '../hooks/useWebSocket';

interface WhaleCardProps {
  transaction: Transaction;
}

export const WhaleCard: React.FC<WhaleCardProps> = ({ transaction }) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-blue-600">
          {parseFloat(transaction.value).toFixed(2)} ETH
        </span>
        {transaction.valueUsd && (
          <span className="text-sm text-gray-600">
            ${transaction.valueUsd.toLocaleString()}
          </span>
        )}
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">From:</span>
          <code className="text-gray-800 font-mono">{formatAddress(transaction.from)}</code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">To:</span>
          <code className="text-gray-800 font-mono">{formatAddress(transaction.to)}</code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Block:</span>
          <span className="text-gray-800">#{transaction.blockNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Time:</span>
          <span className="text-gray-800">{formatTime(transaction.timestamp)}</span>
        </div>
      </div>

      <a
        href={`https://etherscan.io/tx/${transaction.hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs text-blue-600 hover:text-blue-800 underline"
      >
        View on Etherscan →
      </a>
    </div>
  );
};
