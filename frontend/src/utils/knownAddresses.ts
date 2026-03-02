export interface KnownAddress {
  name: string;
  type: 'exchange' | 'defi' | 'bridge';
}

// Well-known Ethereum mainnet addresses (lowercase for lookup)
const KNOWN: Record<string, KnownAddress> = {
  // ── Binance
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': { name: 'Binance', type: 'exchange' },
  '0xd551234ae421e3bcba99a0da6d736074f22192ff': { name: 'Binance', type: 'exchange' },
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { name: 'Binance Cold', type: 'exchange' },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { name: 'Binance', type: 'exchange' },
  '0x564286362092d8e7936f0549571a803b203aaced': { name: 'Binance', type: 'exchange' },
  '0x0681d8db095565fe8a346fa0277bffde9c0edbbf': { name: 'Binance', type: 'exchange' },
  '0xfe9e8709d3215310075d67e3ed32a380ccf451c8': { name: 'Binance', type: 'exchange' },
  '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67': { name: 'Binance', type: 'exchange' },
  // ── Coinbase
  '0xa090e606e30bd747d4e6245a1517ebe430f0057e': { name: 'Coinbase', type: 'exchange' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { name: 'Coinbase', type: 'exchange' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { name: 'Coinbase', type: 'exchange' },
  '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740': { name: 'Coinbase', type: 'exchange' },
  '0x3cd751e6b0078be393132286c442345e5dc49699': { name: 'Coinbase', type: 'exchange' },
  '0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511': { name: 'Coinbase', type: 'exchange' },
  '0xeb2629a2734e272bcc07bda959863f316f4bd4cf': { name: 'Coinbase', type: 'exchange' },
  // ── Kraken
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { name: 'Kraken', type: 'exchange' },
  '0xae2d4617c862309a3d75a0ffb358c7a5009c673f': { name: 'Kraken', type: 'exchange' },
  '0x43984d578803891dfa9706bdeee6078d80cfc79e': { name: 'Kraken', type: 'exchange' },
  '0xda9dfa130df4de4673b89022ee50ff26f6ea73cf': { name: 'Kraken', type: 'exchange' },
  // ── OKX
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { name: 'OKX', type: 'exchange' },
  '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3': { name: 'OKX', type: 'exchange' },
  // ── Bitfinex
  '0x742d35cc6634c0532925a3b844bc454e4438f44e': { name: 'Bitfinex', type: 'exchange' },
  '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f': { name: 'Bitfinex', type: 'exchange' },
  '0x876eabf441b2ee5b5b0554fd502a8e0600950cfa': { name: 'Bitfinex', type: 'exchange' },
  // ── Gemini
  '0xd24400ae8bfebb18ca49be86258a3c749cf46853': { name: 'Gemini', type: 'exchange' },
  '0x07ee55aa48bb72dcc6e9d78256648910de513eca': { name: 'Gemini', type: 'exchange' },
  // ── Bybit
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': { name: 'Bybit', type: 'exchange' },
  // ── Uniswap
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2', type: 'defi' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3', type: 'defi' },
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': { name: 'Uniswap Router', type: 'defi' },
  // ── Curve
  '0x99a58482bd75cbab83b27ec03ca68ff489b5788f': { name: 'Curve', type: 'defi' },
  // ── Aave
  '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': { name: 'Aave V3', type: 'defi' },
};

export function lookupAddress(addr: string): KnownAddress | undefined {
  return KNOWN[addr.toLowerCase()];
}
