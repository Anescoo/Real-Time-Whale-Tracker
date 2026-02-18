import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  valueUsd: number;
  timestamp: number;
}

export interface DashboardStats {
  totalWhales: number;
  totalVolumeEth: number;
  totalVolumeUsd: number;
  averageTransactionEth: number;
  largestTransactionEth: number;
  last24hCount: number;
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: number;
  error?: string; // ✅ AJOUT DE LA PROPRIÉTÉ ERROR
}

export const useWebSocket = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalWhales: 0,
    totalVolumeEth: 0,
    totalVolumeUsd: 0,
    averageTransactionEth: 0,
    largestTransactionEth: 0,
    last24hCount: 0,
  });
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'connecting',
    lastUpdate: Date.now(),
  });
  const [connectedClients, setConnectedClients] = useState(0);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    console.log('🔌 Connecting to:', backendUrl);

    const socket: Socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to backend! Socket ID:', socket.id);
      setConnection({ status: 'connected', lastUpdate: Date.now() });
      fetchInitialData();
    });

    socket.on('disconnect', () => {
      console.warn('❌ Disconnected from backend');
      setConnection({ status: 'disconnected', lastUpdate: Date.now() });
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      setConnection({ 
        status: 'error', 
        lastUpdate: Date.now(),
        error: error.message // ✅ AJOUT DU MESSAGE D'ERREUR
      });
    });

    socket.on('whale-transaction', (data: Transaction) => {
      console.log('🐋 New whale:', data);
      setTransactions((prev) => [data, ...prev].slice(0, 100));
    });

    socket.on('connected-clients', (count: number) => {
      console.log('👥 Connected clients:', count);
      setConnectedClients(count);
    });

    socket.on('eth-price', (data: { price: number }) => {
      console.log('💰 ETH price:', data.price);
    });

    const fetchInitialData = async () => {
      try {
        const whalesRes = await fetch(`${backendUrl}/api/whales?limit=20`);
        const whalesData = await whalesRes.json();
        setTransactions(whalesData);

        const statsRes = await fetch(`${backendUrl}/api/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);

        console.log('📊 Initial data loaded:', {
          whales: whalesData.length,
          stats: statsData,
        });
      } catch (error) {
        console.error('❌ Error fetching initial data:', error);
        setConnection({ 
          status: 'error', 
          lastUpdate: Date.now(),
          error: error instanceof Error ? error.message : 'Failed to fetch initial data'
        });
      }
    };

    return () => {
      console.log('🔌 Cleaning up socket connection');
      socket.disconnect();
    };
  }, []);

  return { transactions, stats, connection, connectedClients };
};
