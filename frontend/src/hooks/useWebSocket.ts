import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  valueEth: number;
  valueUsd?: number;
  timestamp: number;
}

export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    console.log('🔌 Initializing WebSocket connection to:', url);

    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection
    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected!', socketInstance.id);
      setIsConnected(true);
    });

    // Disconnection
    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    // Clients count
    socketInstance.on('clients:count', (count: number) => {
      console.log('👥 Connected clients:', count);
      setConnectedClients(count);
    });

    // Whale transactions
    socketInstance.on('whale:transaction', (transaction: Transaction) => {
      console.log('🐋 New whale transaction:', transaction);
      setTransactions((prev) => [transaction, ...prev].slice(0, 10)); // Garder les 10 dernières
    });

    // Pong response
    socketInstance.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      socketInstance.disconnect();
    };
  }, [url]);

  const sendPing = () => {
    if (socket) {
      console.log('🏓 Sending ping...');
      socket.emit('ping');
    }
  };

  return {
    socket,
    isConnected,
    connectedClients,
    transactions,
    sendPing
  };
};
