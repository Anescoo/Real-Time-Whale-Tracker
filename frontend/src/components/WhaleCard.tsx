import React from 'react';
import type { Transaction } from '../types/whale.types';

interface Props {
  transaction: Transaction;
}

export const WhaleCard: React.FC<Props> = ({ transaction }) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🐋</span>
          <div>
            <p className="text-sm text-gray-500">Transaction</p>
            <a
              href={`https://etherscan.io/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-mono text-sm"
            >
              {formatAddress(transaction.hash)}
            </a>
          </div>
        </div>
        <span className="text-xs text-gray-400">{formatTime(transaction.timestamp)}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">From</p>
          <a
            href={`https://etherscan.io/address/${transaction.from}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-gray-900 hover:text-blue-600"
          >
            {formatAddress(transaction.from)}
          </a>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">To</p>
          <a
            href={`https://etherscan.io/address/${transaction.to}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-gray-900 hover:text-blue-600"
          >
            {formatAddress(transaction.to)}
          </a>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(transaction.valueEth)} ETH
            </p>
            {transaction.valueUsd && (
              <p className="text-sm text-gray-600">
                ${formatNumber(transaction.valueUsd)}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-500">Block #{transaction.blockNumber}</span>
        </div>
      </div>
    </div>
  );
};
