import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Transaction {
  hash: string;
  value: string;
  timestamp: number;
}

interface ChartsProps {
  transactions: Transaction[];
  timeRange: '1h' | '24h' | '7d';
}

export const Charts: React.FC<ChartsProps> = ({ transactions, timeRange }) => {
  // Préparer les données pour le graphique de volume
  const volumeData = useMemo(() => {
    const intervals = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 7;
    const intervalMs = timeRange === '1h' ? 300000 : timeRange === '24h' ? 3600000 : 86400000;
    
    const now = Date.now();
    const data = [];

    for (let i = intervals - 1; i >= 0; i--) {
      const time = now - (i * intervalMs);
      const volume = transactions
        .filter(tx => {
          const txTime = tx.timestamp;
          return txTime >= time && txTime < time + intervalMs;
        })
        .reduce((sum, tx) => sum + parseFloat(tx.value), 0);

      data.push({
        time: new Date(time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: timeRange === '1h' ? '2-digit' : undefined 
        }),
        volume: Number(volume.toFixed(2)),
        count: transactions.filter(tx => {
          const txTime = tx.timestamp;
          return txTime >= time && txTime < time + intervalMs;
        }).length,
      });
    }

    return data;
  }, [transactions, timeRange]);

  // Distribution des tailles de transactions
  const distributionData = useMemo(() => {
    const ranges = [
      { label: '10-50', min: 10, max: 50 },
      { label: '50-100', min: 50, max: 100 },
      { label: '100-500', min: 100, max: 500 },
      { label: '500+', min: 500, max: Infinity },
    ];

    return ranges.map(range => ({
      range: range.label,
      count: transactions.filter(tx => {
        const value = parseFloat(tx.value);
        return value >= range.min && value < range.max;
      }).length,
    }));
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Volume Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Volume Over Time
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={volumeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transaction Distribution (ETH)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="range" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
