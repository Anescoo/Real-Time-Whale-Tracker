import React from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import type { ConnectionState } from '../types/whale.types';

interface Props {
  connection: ConnectionState;
  connectedClients: number;
}

export const Header: React.FC<Props> = ({ connection, connectedClients }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🐋</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Whale Tracker</h1>
            <p className="text-sm text-gray-500">Real-time Ethereum whale monitoring</p>
          </div>
        </div>
        <ConnectionStatus connection={connection} connectedClients={connectedClients} />
      </div>
    </header>
  );
};
