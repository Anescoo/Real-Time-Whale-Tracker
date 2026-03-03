import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  valueEth: number;
  valueUsd: number;
  timestamp: number;
  network: string;
}

export interface Stats {
  blocksProcessed: number;
  whalesDetected: number;
  totalVolumeEth: number;
  totalVolumeUsd: number;
  largestTransactionEth: number;
  last24hCount: number;
  lastBlockNumber: number;
  ethPrice: number;
  whaleThreshold: number;
  connectedClients: number;
  symbol?: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const DEFAULT_STATS: Stats = {
  blocksProcessed: 0, whalesDetected: 0, totalVolumeEth: 0,
  totalVolumeUsd: 0, largestTransactionEth: 0, last24hCount: 0,
  lastBlockNumber: 0, ethPrice: 0, whaleThreshold: 100, connectedClients: 0,
};

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export const useWebSocket = (selectedNetwork = 'eth-mainnet') => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [ethPrice, setEthPrice] = useState(0);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [connectedClients, setConnectedClients] = useState(0);
  const newestHashRef = useRef<string | null>(null);
  const prevBlocksRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);
  const selectedNetworkRef = useRef(selectedNetwork);

  // Keep ref in sync so the connect handler always uses the latest value
  useEffect(() => { selectedNetworkRef.current = selectedNetwork; }, [selectedNetwork]);

  // One-time socket setup
  useEffect(() => {
    const socket: Socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    const fetchHistory = async (network: string) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/whales/recent?limit=100&network=${network}`);
        if (res.ok) {
          const data: Transaction[] = await res.json();
          setTransactions(data);
        }
      } catch { /* ignore */ }
    };

    socket.on('connect', async () => {
      setStatus('connected');
      socket.emit('join:network', { network: selectedNetworkRef.current });
      await fetchHistory(selectedNetworkRef.current);
    });

    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('error'));

    socket.on('whale:transaction', (tx: Transaction) => {
      // 🔒 Only add to the visible feed for the selected network
      if (tx.network !== selectedNetworkRef.current) return;

      console.log(
        `%c🐋 Whale%c ${tx.valueEth.toFixed(4)} ${tx.network ?? ''}` +
        (tx.valueUsd > 0 ? ` (€${tx.valueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })})` : '') +
        ` | block #${tx.blockNumber} | ${tx.from.slice(0, 10)}… → ${tx.to.slice(0, 10)}…`,
        'color:#ef4444;font-weight:700',
        'color:inherit'
      );

      newestHashRef.current = tx.hash;
      setTransactions(prev => [tx, ...prev].slice(0, 250));
    });

    // Notification events from ALL networks (regardless of selected network)
    socket.on('whale:notification', (tx: Transaction) => {
      window.dispatchEvent(new CustomEvent('new-whale', { detail: tx }));
    });

    socket.on('eth:price', (price: number) => {
      if (price > 0) setEthPrice(price);
    });

    socket.on('stats:update', (data: Stats) => {
      if (data.blocksProcessed > prevBlocksRef.current) {
        console.log(
          `%c📦 Block%c #${data.lastBlockNumber} | scanned: ${data.blocksProcessed} | whales: ${data.whalesDetected}`,
          'color:#06b6d4;font-weight:600',
          'color:inherit'
        );
        prevBlocksRef.current = data.blocksProcessed;
      }
      setStats(data);
      if (data.ethPrice > 0) setEthPrice(data.ethPrice);
      setConnectedClients(data.connectedClients);
    });

    socket.on('initial:stats', (data: Stats | null) => {
      if (!data) return;
      setStats(data);
      if (data.ethPrice > 0) setEthPrice(data.ethPrice);
    });

    socket.on('clients:count', (count: number) => setConnectedClients(count));

    return () => { socket.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch network when selectedNetwork changes (after first mount)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    socket.emit('join:network', { network: selectedNetwork });
    setTransactions([]);
    setStats(DEFAULT_STATS);
    prevBlocksRef.current = 0;

    fetch(`${BACKEND_URL}/api/whales/recent?limit=100&network=${selectedNetwork}`)
      .then((r) => r.json())
      .then((data: Transaction[]) => setTransactions(data))
      .catch(() => { /* ignore */ });
  }, [selectedNetwork]); // eslint-disable-line react-hooks/exhaustive-deps

  return { transactions, stats, ethPrice, status, connectedClients, newestHash: newestHashRef.current };
};
