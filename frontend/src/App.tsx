// frontend/src/App.tsx
import { useState, useEffect } from 'react';

interface HealthResponse {
  status: string;
  timestamp: string;
  message: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Fetching backend health...');
    
    fetch('http://localhost:3000/health')
      .then(res => {
        console.log('✅ Response received:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('✅ Data:', data);
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '3rem' }}>🐋 Whale Tracker</h1>
      <p style={{ color: '#666' }}>Real-time Ethereum whale transaction monitoring</p>

      <hr style={{ margin: '2rem 0' }} />

      {loading && (
        <div style={{ 
          background: '#fff3cd', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid #ffc107'
        }}>
          <h2>⏳ Loading...</h2>
          <p>Connecting to backend...</p>
        </div>
      )}

      {health && (
        <div style={{ 
          background: '#d4edda', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid #28a745'
        }}>
          <h2>✅ Backend Connected!</h2>
          <div style={{ 
            background: '#fff', 
            padding: '1rem', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            <pre>{JSON.stringify(health, null, 2)}</pre>
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#f8d7da', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid #dc3545'
        }}>
          <h2>❌ Connection Error</h2>
          <p><strong>Message:</strong> {error}</p>
          <p><strong>Solution:</strong> Make sure backend is running on http://localhost:3000</p>
          <code style={{ 
            display: 'block', 
            background: '#fff', 
            padding: '0.5rem',
            marginTop: '1rem',
            borderRadius: '4px'
          }}>
            cd backend && npm run dev
          </code>
        </div>
      )}
    </div>
  );
}

export default App;
