import React from 'react';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
}

interface TopWhalesProps {
  whales: Transaction[];
}

export const TopWhales: React.FC<TopWhalesProps> = ({ whales }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🏆 Top 10 Whales
      </h3>

      {whales.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No whales detected yet
        </div>
      ) : (
        <div className="space-y-3">
          {whales.map((whale, index) => (
            <div
              key={whale.hash}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-100 hover:border-blue-300 transition-colors"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full font-bold text-sm">
                {index + 1}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-gray-900">
                  {parseFloat(whale.value).toFixed(2)} ETH
                </div>
                <div className="text-xs text-gray-500 truncate font-mono">
                  {whale.from.slice(0, 10)}...{whale.from.slice(-8)}
                </div>
              </div>

              {/* Time */}
              <div className="text-xs text-gray-500">
                {new Date(whale.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
