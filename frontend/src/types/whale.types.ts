/**
 * Transaction de whale Ethereum
 */
export interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  valueEth: number;
  valueUsd?: number;
  timestamp: number;
}

/**
 * Statistiques du dashboard
 */
export interface DashboardStats {
  totalWhales: number;
  totalVolumeEth: number;
  totalVolumeUsd: number;
  averageTransactionEth: number;
  largestTransactionEth: number;
  last24hCount: number;
}

/**
 * État de la connexion WebSocket
 */
export interface ConnectionState {
  isConnected: boolean;
  lastUpdate: number | null;
  error: string | null;
}

/**
 * Props pour le hook useWebSocket (optionnel)
 */
export interface UseWebSocketReturn {
  socket: any; // Socket.IO instance
  isConnected: boolean;
  connection: ConnectionState;
  connectedClients: number;
  transactions: Transaction[];
  stats: DashboardStats;
  sendPing: () => void;
}