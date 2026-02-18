import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  valueEth: number; // ✅ AJOUT pour cohérence
  valueUsd: number;
  timestamp: number;
}

export interface DashboardStats {
  blocksProcessed: number; // ✅ AJOUT
  whalesDetected: number; // ✅ AJOUT
  totalWhales: number;
  totalVolume: number; // ✅ AJOUT (alias totalVolumeEth)
  totalVolumeEth: number;
  totalVolumeUsd: number;
  averageTransactionEth: number;
  largestTransactionEth: number;
  last24hCount: number;
  ethPrice: number; // ✅ AJOUT
  whaleThreshold: number; // ✅ AJOUT
  connectedClients: number; // ✅ AJOUT
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: number;
  error?: string;
}

export const useWebSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null); // ✅ Exposer socket
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    blocksProcessed: 0,
    whalesDetected: 0,
    totalWhales: 0,
    totalVolume: 0,
    totalVolumeEth: 0,
    totalVolumeUsd: 0,
    averageTransactionEth: 0,
    largestTransactionEth: 0,
    last24hCount: 0,
    ethPrice: 0,
    whaleThreshold: 100,
    connectedClients: 0,
  });
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'connecting',
    lastUpdate: Date.now(),
  });
  const [ethPrice, setEthPrice] = useState<number>(0); // ✅ État séparé pour le prix

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    console.log('🔌 Connecting to:', backendUrl);

    const newSocket: Socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // ✅ CONNEXION ÉTABLIE
    newSocket.on('connect', () => {
      console.log('✅ Connected to backend! Socket ID:', newSocket.id);
      setConnection({ status: 'connected', lastUpdate: Date.now() });
      setSocket(newSocket);
      
      // Exposer pour debug
      (window as any).debugSocket = newSocket;
      
      fetchInitialData();
    });

    // ✅ DÉCONNEXION
    newSocket.on('disconnect', (reason) => {
      console.warn('❌ Disconnected from backend:', reason);
      setConnection({ status: 'disconnected', lastUpdate: Date.now() });
    });

    // ✅ ERREUR DE CONNEXION
    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      setConnection({ 
        status: 'error', 
        lastUpdate: Date.now(),
        error: error.message
      });
    });

    // ✅ NOUVELLE WHALE (temps réel) 🔥
    newSocket.on('whale:transaction', (data: Transaction) => {
      console.log('🐋 NEW WHALE RECEIVED:', data);
      setTransactions((prev) => [data, ...prev].slice(0, 100));
      
      // Mettre à jour les stats localement
      setStats(prevStats => ({
        ...prevStats,
        whalesDetected: prevStats.whalesDetected + 1,
        totalWhales: prevStats.totalWhales + 1,
      }));
    });

    // ✅ STATS UPDATE (temps réel)
    newSocket.on('stats:update', (newStats: DashboardStats) => {
      console.log('📊 Stats update received:', newStats);
      setStats(newStats);
    });

    // ✅ PRIX ETH UPDATE (temps réel)
    newSocket.on('eth:price', (price: number) => {
      console.log('💰 ETH Price update:', price);
      setEthPrice(price);
      setStats(prev => ({ ...prev, ethPrice: price }));
    });

    // ✅ CLIENTS CONNECTÉS
    newSocket.on('connected-clients', (count: number) => {
      console.log('👥 Connected clients:', count);
      setStats(prev => ({ ...prev, connectedClients: count }));
    });

    // ✅ PONG (test connexion)
    newSocket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    // ✅ RÉCUPÉRER LES DONNÉES INITIALES
    const fetchInitialData = async () => {
      try {
        console.log('📡 Fetching initial data...');
        
        // Whales
        const whalesRes = await fetch(`${backendUrl}/api/whales?limit=50`);
        if (!whalesRes.ok) throw new Error(`Whales API error: ${whalesRes.status}`);
        const whalesData = await whalesRes.json();
        console.log('🐋 Initial whales loaded:', whalesData.length);
        setTransactions(whalesData);

        // Stats
        const statsRes = await fetch(`${backendUrl}/api/stats`);
        if (!statsRes.ok) throw new Error(`Stats API error: ${statsRes.status}`);
        const statsData = await statsRes.json();
        console.log('📊 Initial stats loaded:', statsData);
        setStats(statsData);
        setEthPrice(statsData.ethPrice || 0);

      } catch (error) {
        console.error('❌ Error fetching initial data:', error);
        setConnection({ 
          status: 'error', 
          lastUpdate: Date.now(),
          error: error instanceof Error ? error.message : 'Failed to fetch initial data'
        });
      }
    };

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, []);

  return { 
    socket,
    transactions, 
    stats, 
    connection, 
    connectedClients: stats.connectedClients,
    ethPrice,
  };
};
