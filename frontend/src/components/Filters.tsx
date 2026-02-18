import React from 'react';

interface FiltersProps {
  minValue: number;
  timeRange: '1h' | '24h' | '7d';
  onMinValueChange: (value: number) => void;
  onTimeRangeChange: (range: '1h' | '24h' | '7d') => void;
}

export const Filters: React.FC<FiltersProps> = ({
  minValue,
  timeRange,
  onMinValueChange,
  onTimeRangeChange,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Min Value Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Value (ETH)
          </label>
          <input
            type="number"
            min="1"
            value={minValue}
            onChange={(e) => onMinValueChange(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Time Range Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range
          </label>
          <div className="flex gap-2">
            {(['1h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
