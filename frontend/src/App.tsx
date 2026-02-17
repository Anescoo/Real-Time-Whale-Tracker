import { useWebSocket } from './hooks/useWebSocket';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

console.log('✅ Frontend env loaded:', BACKEND_URL);

function App() {
  const { isConnected, connectedClients, transactions, sendPing } = useWebSocket(BACKEND_URL);

  const triggerTestWhale = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/test-whale`);
      const data = await response.json();
      console.log('✅ Test whale triggered:', data);
    } catch (error) {
      console.error('❌ Error triggering test whale:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🐋 Whale Tracker - WebSocket Test</h1>

      {/* Section 1: Connection Status */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
        <h2>📡 Connection Status</h2>
        <p>
          <strong>Connection:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </p>
        <p>
          <strong>👥 Connected clients:</strong> {connectedClients}
        </p>
        {/* <button 
          onClick={sendPing}
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🏓 Test Ping
        </button> */}
        {/* <button 
          onClick={triggerTestWhale}
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          🐋 Trigger Test Whale
        </button> */}
      </div>

      {/* Section 2: Transactions List */}
      <div style={{ border: '1px solid #ccc', padding: '15px' }}>
        <h2>🐋 Whale Transactions ({transactions.length})</h2>
        {transactions.length === 0 ? (
          <p style={{ color: '#666' }}>No transactions yet. Click "Trigger Test Whale" to test!</p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.hash}
              style={{
                border: '1px solid #e0e0e0',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px'
              }}
            >
              <p><strong>Hash:</strong> {tx.hash.substring(0, 20)}...</p>
              <p><strong>Block:</strong> {tx.blockNumber}</p>
              <p><strong>Value:</strong> {tx.valueEth.toFixed(2)} ETH 
                {tx.valueUsd && ` ($${tx.valueUsd.toLocaleString()})`}
              </p>
              <p><strong>From:</strong> {tx.from.substring(0, 10)}...</p>
              <p><strong>To:</strong> {tx.to.substring(0, 10)}...</p>
              <p style={{ fontSize: '0.8em', color: '#666' }}>
                {new Date(tx.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
