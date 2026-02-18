import React from 'react';
import type { ConnectionState } from '../types/whale.types';

interface Props {
  connection: ConnectionState;
}

export const ConnectionStatus: React.FC<Props> = ({ connection }) => {
  const { status, lastUpdate, error } = connection;

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <div className="text-sm">
        <div className="font-medium text-gray-900">{getStatusText()}</div>
        <div className="text-xs text-gray-500">
          {new Date(lastUpdate).toLocaleTimeString()}
        </div>
        {error && (
          <div className="text-xs text-red-600 mt-1">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
