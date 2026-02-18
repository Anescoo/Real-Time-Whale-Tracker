import React from 'react';
import type { ConnectionState } from '../types/whale.types';

interface Props {
  connection: ConnectionState;
  connectedClients: number;
}

export const ConnectionStatus: React.FC<Props> = ({ connection, connectedClients }) => {
  const { isConnected, lastUpdate, error } = connection;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`} />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {connectedClients > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-lg">👥</span>
          <span className="text-sm text-gray-600">
            {connectedClients} {connectedClients === 1 ? 'client' : 'clients'}
          </span>
        </div>
      )}

      {lastUpdate && (
        <span className="text-xs text-gray-400">
          Last update: {new Date(lastUpdate).toLocaleTimeString()}
        </span>
      )}

      {error && (
        <span className="text-xs text-red-600">
          Error: {error}
        </span>
      )}
    </div>
  );
};
