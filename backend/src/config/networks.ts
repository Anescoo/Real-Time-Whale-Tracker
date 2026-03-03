import { Network } from 'alchemy-sdk';

export interface NetworkConfig {
  id: string;
  name: string;
  symbol: string;
  color: string;
  explorer: string;      // base URL: explorer + '/tx/' + hash
  provider: 'alchemy' | 'mempool' | 'coming_soon';
  alchemyNetwork?: Network;
  threshold: number;     // whale threshold in native units
  priceSymbol: string;   // Binance pair e.g. 'ETHEUR'
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  'eth-mainnet': {
    id: 'eth-mainnet',
    name: 'Ethereum',
    symbol: 'ETH',
    color: '#627eea',
    explorer: 'https://etherscan.io',
    provider: 'alchemy',
    alchemyNetwork: Network.ETH_MAINNET,
    threshold: 100,
    priceSymbol: 'ETHEUR',
    sliderMin: 100, sliderMax: 2000, sliderStep: 100,
  },
  'bitcoin': {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    color: '#f7931a',
    explorer: 'https://mempool.space',
    provider: 'mempool',
    threshold: 50,
    priceSymbol: 'BTCEUR',
    sliderMin: 50, sliderMax: 1000, sliderStep: 50,
  },
  'polygon-mainnet': {
    id: 'polygon-mainnet',
    name: 'Polygon',
    symbol: 'POL',
    color: '#8247e5',
    explorer: 'https://polygonscan.com',
    provider: 'coming_soon',
//     alchemyNetwork: Network.MATIC_MAINNET,
    threshold: 500000,
    priceSymbol: 'MATICEUR',
    sliderMin: 100000, sliderMax: 5000000, sliderStep: 100000,
  }, 
  'arb-mainnet': {
    id: 'arb-mainnet',
    name: 'Arbitrum',
    symbol: 'ETH',
    color: '#12aaff',
    explorer: 'https://arbiscan.io',
    provider: 'coming_soon',
    threshold: 100,
    priceSymbol: 'ETHEUR',
    sliderMin: 100, sliderMax: 2000, sliderStep: 100,
  },
  'opt-mainnet': {
    id: 'opt-mainnet',
    name: 'Optimism',
    symbol: 'ETH',
    color: '#ff0420',
    explorer: 'https://optimistic.etherscan.io',
    provider: 'coming_soon',
    threshold: 100,
    priceSymbol: 'ETHEUR',
    sliderMin: 100, sliderMax: 2000, sliderStep: 100,
  },
  'base-mainnet': {
    id: 'base-mainnet',
    name: 'Base',
    symbol: 'ETH',
    color: '#0052ff',
    explorer: 'https://basescan.org',
    provider: 'coming_soon',
    threshold: 100,
    priceSymbol: 'ETHEUR',
    sliderMin: 100, sliderMax: 2000, sliderStep: 100,
  },
  'solana': {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    color: '#9945ff',
    explorer: 'https://solscan.io',
    provider: 'coming_soon',
    threshold: 10000,
    priceSymbol: 'SOLEUR',
    sliderMin: 1000, sliderMax: 100000, sliderStep: 1000,
  },
  'bnb': {
    id: 'bnb',
    name: 'BNB Chain',
    symbol: 'BNB',
    color: '#f3ba2f',
    explorer: 'https://bscscan.com',
    provider: 'coming_soon',
    threshold: 1000,
    priceSymbol: 'BNBEUR',
    sliderMin: 100, sliderMax: 10000, sliderStep: 100,
  },
  'xrp': {
    id: 'xrp',
    name: 'XRP',
    symbol: 'XRP',
    color: '#346aa9',
    explorer: 'https://xrpscan.com',
    provider: 'coming_soon',
    threshold: 1000000,
    priceSymbol: 'XRPEUR',
    sliderMin: 100000, sliderMax: 10000000, sliderStep: 100000,
  },
  'usdt': {
    id: 'usdt',
    name: 'Tether USDT',
    symbol: 'USDT',
    color: '#26a17b',
    explorer: 'https://etherscan.io',
    provider: 'coming_soon',
    threshold: 1000000,
    priceSymbol: 'USDTEUR',
    sliderMin: 100000, sliderMax: 10000000, sliderStep: 100000,
  },
  'usdc': {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    color: '#2775ca',
    explorer: 'https://etherscan.io',
    provider: 'coming_soon',
    threshold: 1000000,
    priceSymbol: 'USDCEUR',
    sliderMin: 100000, sliderMax: 10000000, sliderStep: 100000,
  },
  'tron': {
    id: 'tron',
    name: 'TRON',
    symbol: 'TRX',
    color: '#ef0027',
    explorer: 'https://tronscan.org',
    provider: 'coming_soon',
    threshold: 10000000,
    priceSymbol: 'TRXEUR',
    sliderMin: 1000000, sliderMax: 100000000, sliderStep: 1000000,
  },
  'doge': {
    id: 'doge',
    name: 'Dogecoin',
    symbol: 'DOGE',
    color: '#c3a634',
    explorer: 'https://dogechain.info',
    provider: 'coming_soon',
    threshold: 1000000,
    priceSymbol: 'DOGEEUR',
    sliderMin: 100000, sliderMax: 10000000, sliderStep: 100000,
  },
  'cardano': {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    color: '#0033ad',
    explorer: 'https://cardanoscan.io',
    provider: 'coming_soon',
    threshold: 5000000,
    priceSymbol: 'ADAEUR',
    sliderMin: 500000, sliderMax: 50000000, sliderStep: 500000,
  },
};

export const NETWORKS_LIST = Object.values(NETWORKS);
