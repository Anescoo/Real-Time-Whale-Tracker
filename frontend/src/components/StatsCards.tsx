import React from 'react';
import type { DashboardStats } from '../types/whale.types';

interface Props {
  stats: DashboardStats;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow" 
       style={{ borderLeftColor: color }}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>
      <span className="text-4xl">{icon}</span>
    </div>
  </div>
);

export const StatsCards: React.FC<Props> = ({ stats }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatUsd = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Total Whales"
        value={stats.totalWhales}
        subtitle="Tracked transactions"
        icon="🐋"
        color="#3B82F6"
      />
      
      <StatCard
        title="Total Volume"
        value={`${formatNumber(stats.totalVolumeEth)} ETH`}
        subtitle={formatUsd(stats.totalVolumeUsd)}
        icon="💰"
        color="#10B981"
      />
      
      <StatCard
        title="Largest Transaction"
        value={`${formatNumber(stats.largestTransactionEth)} ETH`}
        icon="🔥"
        color="#EF4444"
      />
      
      <StatCard
        title="Average Transaction"
        value={`${formatNumber(stats.averageTransactionEth)} ETH`}
        icon="📊"
        color="#8B5CF6"
      />
      
      <StatCard
        title="Last 24h"
        value={stats.last24hCount}
        subtitle="Recent whales"
        icon="⏰"
        color="#F59E0B"
      />
      
      <StatCard
        title="Status"
        value="Live"
        subtitle="Real-time monitoring"
        icon="✅"
        color="#06B6D4"
      />
    </div>
  );
};
