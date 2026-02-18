import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  valueEth: number;
  valueUsd?: number;
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
  isConnected: boolean;
  lastUpdate: number | null;
  error: string | null;
}

const MAX_TRANSACTIONS = 50;

export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // ✅ État de connexion
  const [connection, setConnection] = useState<ConnectionState>({
    isConnected: false,
    lastUpdate: null,
    error: null,
  });

  // ✅ État des statistiques
  const [stats, setStats] = useState<DashboardStats>({
    totalWhales: 0,
    totalVolumeEth: 0,
    totalVolumeUsd: 0,
    averageTransactionEth: 0,
    largestTransactionEth: 0,
    last24hCount: 0,
  });

  // ✅ Fonction pour calculer les stats
  const calculateStats = useCallback((txs: Transaction[]) => {
    if (txs.length === 0) {
      return {
        totalWhales: 0,
        totalVolumeEth: 0,
        totalVolumeUsd: 0,
        averageTransactionEth: 0,
        largestTransactionEth: 0,
        last24hCount: 0,
      };
    }

    const now = Date.now();
    const last24h = txs.filter(tx => now - tx.timestamp < 24 * 60 * 60 * 1000);
    
    const totalVolumeEth = txs.reduce((sum, tx) => sum + tx.valueEth, 0);
    const totalVolumeUsd = txs.reduce((sum, tx) => sum + (tx.valueUsd || 0), 0);
    const largestTransactionEth = Math.max(...txs.map(tx => tx.valueEth));

    return {
      totalWhales: txs.length,
      totalVolumeEth,
      totalVolumeUsd,
      averageTransactionEth: totalVolumeEth / txs.length,
      largestTransactionEth,
      last24hCount: last24h.length,
    };
  }, []);

  useEffect(() => {
    console.log('🔌 Initializing WebSocket connection to:', url);

    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // ✅ Connection
    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected!', socketInstance.id);
      setIsConnected(true);
      setConnection({
        isConnected: true,
        lastUpdate: Date.now(),
        error: null,
      });
    });

    // ✅ Disconnection
    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
      setConnection(prev => ({
        ...prev,
        isConnected: false,
      }));
    });

    // ✅ Error handling
    socketInstance.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setConnection(prev => ({
        ...prev,
        error: error.message,
      }));
    });

    // ✅ Clients count
    socketInstance.on('clients:count', (count: number) => {
      console.log('👥 Connected clients:', count);
      setConnectedClients(count);
    });

    // ✅ Whale transactions
    socketInstance.on('whale:transaction', (transaction: Transaction) => {
      console.log('🐋 New whale transaction:', transaction);
      
      setTransactions((prev) => {
        const updated = [transaction, ...prev].slice(0, MAX_TRANSACTIONS);
        
        // Recalculer les stats après chaque transaction
        setStats(calculateStats(updated));
        
        // Mettre à jour lastUpdate
        setConnection(prev => ({
          ...prev,
          lastUpdate: Date.now(),
        }));
        
        return updated;
      });
    });

    // ✅ Pong response
    socketInstance.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    setSocket(socketInstance);

    // ✅ Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      socketInstance.disconnect();
    };
  }, [url, calculateStats]);

  const sendPing = () => {
    if (socket) {
      console.log('🏓 Sending ping...');
      socket.emit('ping');
    }
  };

  // ✅ Retourner TOUTES les données nécessaires
  return {
    socket,
    isConnected,
    connectedClients,
    transactions,
    stats,           // ← Ajouté
    connection,      // ← Ajouté
    sendPing
  };
};
