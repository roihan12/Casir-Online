import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@shared/ui';
import { formatRupiah, formatNumber, formatPercent } from '@shared/lib';

/**
 * Stats Card Component
 * Displays a statistic with icon, value, label, and optional change indicator
 */
const StatsCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeLabel = 'dari kemarin',
  format = 'number', // 'number', 'currency', 'custom'
  loading = false,
  color = 'text-indigo-500',
  className = '',
}) => {
  // Format value based on type
  const formattedValue = () => {
    if (loading) return '...';
    if (format === 'currency') return formatRupiah(value);
    if (format === 'number') return formatNumber(value);
    return value;
  };

  // Determine change color and icon
  const getChangeInfo = () => {
    if (change === null || change === undefined) return null;
    
    if (change > 0) {
      return {
        icon: TrendingUp,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50',
      };
    } else if (change < 0) {
      return {
        icon: TrendingDown,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
      };
    }
    return {
      icon: Minus,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
    };
  };

  const changeInfo = getChangeInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card hover className={`bg-white/70 ${className}`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl glass-surface ${color}`}>
            {Icon && <Icon className="w-6 h-6" />}
          </div>
          {changeInfo && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${changeInfo.bgColor}`}>
              <changeInfo.icon className={`w-4 h-4 ${changeInfo.color}`} />
              <span className={`text-xs font-medium ${changeInfo.color}`}>
                {formatPercent(change)}
              </span>
            </div>
          )}
        </div>
        
        <h3 className={`text-2xl font-bold text-gray-800 mb-1 ${loading ? 'animate-pulse' : ''}`}>
          {formattedValue()}
        </h3>
        
        <p className="text-sm text-gray-500">{title}</p>
        
        {changeInfo && changeLabel && (
          <p className="text-xs text-gray-400 mt-2">{changeLabel}</p>
        )}
      </Card>
    </motion.div>
  );
};

export default StatsCard;
