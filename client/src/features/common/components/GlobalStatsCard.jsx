import React from "react";
import { ArrowUp, ArrowDown, Loader } from "lucide-react";

/**
 * GlobalStatsCard - Displays a statistic with title, value, and change percentage
 *
 * @param {Object} props
 * @param {String} props.title - Card title
 * @param {String|Number} props.value - Main value to display
 * @param {String} props.percentage - Percentage change (e.g. "15%")
 * @param {Boolean} props.isPositive - Whether the change is positive or negative
 * @param {Number} props.changeValue - Actual value of change (optional)
 * @param {Function} props.icon - Lucide icon component
 * @param {Object} props.badge - Optional badge to display (e.g. for cabang name)
 * @param {String} props.badge.text - Badge text
 * @param {String} props.badge.color - Badge color theme (e.g. "indigo", "blue")
 * @param {Boolean} props.isLoading - Whether the card is in loading state
 */
const GlobalStatsCard = ({
  title,
  value,
  percentage,
  isPositive = true,
  changeValue,
  icon: Icon,
  badge = null,
  isLoading = false,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-gray-500 text-sm">{title}</p>
        <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
      </div>

      <div className="mt-2">
        {/* Show badge if provided */}
        {badge && (
          <div
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800 mb-2`}
          >
            {badge.text}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ) : (
          <>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>

            <div className="flex items-center mt-1">
              <div
                className={`flex items-center ${
                  isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {isPositive ? (
                  <ArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">{percentage}</span>
                {changeValue !== undefined && (
                  <span className="text-xs ml-1">
                    ({isPositive ? "+" : ""}
                    {changeValue}%)
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 ml-2">vs. bulan lalu</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GlobalStatsCard;
