import React from 'react';
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import formatCurrency from '@common/utils/formatCurrency';

/**
 * BranchPerformanceCard - Displays top performing branches by revenue.
 * Only shown in global view mode.
 * 
 * @param {Object} props
 * @param {Array} props.branchPerformance - Array of branch performance data
 * @param {boolean} props.isGlobalView - Whether dashboard is in global view
 */
const BranchPerformanceCard = ({ branchPerformance = [], isGlobalView = false }) => {
  // Only show in global view
  if (!isGlobalView) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-4">
          <MapPin className="h-5 w-5 text-indigo-500 mr-2" />
          <h3 className="text-base font-semibold text-gray-800">Performa Cabang</h3>
        </div>
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          <p className="text-center">
            Data performa cabang hanya tersedia<br />dalam tampilan global
          </p>
        </div>
      </div>
    );
  }

  // No data state
  if (!branchPerformance || branchPerformance.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-4">
          <MapPin className="h-5 w-5 text-indigo-500 mr-2" />
          <h3 className="text-base font-semibold text-gray-800">Performa Cabang</h3>
        </div>
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          Tidak ada data performa cabang
        </div>
      </div>
    );
  }

  // Calculate max revenue for percentage bars
  const maxRevenue = Math.max(...branchPerformance.map((b) => b.revenue || 0));

  // Color palette for bars
  const barColors = [
    'bg-indigo-500',
    'bg-blue-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-emerald-500',
  ];

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-indigo-500 mr-2" />
          <h3 className="text-base font-semibold text-gray-800">
            Top Cabang
          </h3>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          30 hari terakhir
        </span>
      </div>

      {/* Branch List */}
      <div className="space-y-4">
        {branchPerformance.slice(0, 5).map((branch, index) => {
          const percentage = maxRevenue > 0 ? (branch.revenue / maxRevenue) * 100 : 0;
          const isPositiveGrowth = (branch.growth || 0) >= 0;

          return (
            <div key={branch.id || index} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center mr-2">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {branch.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {formatCurrency(branch.revenue)}
                  </span>
                  {branch.growth !== undefined && (
                    <span className={`ml-2 flex items-center text-xs ${isPositiveGrowth ? 'text-green-600' : 'text-red-500'}`}>
                      {isPositiveGrowth ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                      {Math.abs(branch.growth).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColors[index % barColors.length]} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BranchPerformanceCard;
