import React from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import type { ConnectionState } from '../types/whale.types';

interface Props {
  connection: ConnectionState;
  connectedClients: number;
}

export const Header: React.FC<Props> = ({ connection, connectedClients }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🐋 Whale Tracker
            </h1>
            <p className="text-sm text-gray-600">
              Real-time Ethereum whale transactions
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-gray-600">Connected clients:</span>
              <span className="ml-2 font-semibold text-blue-600">
                {connectedClients}
              </span>
            </div>
            <ConnectionStatus connection={connection} />
          </div>
        </div>
      </div>
    </header>
  );
};
