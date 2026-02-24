import React from "react";
import { Loader2 } from "lucide-react";

// Tab component to replace Material UI Tabs
export const ReportTabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`${
              activeTab === tab.value
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } flex items-center px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors duration-150`}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Card component to replace Material UI Card
export const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

// CardContent component to replace Material UI CardContent
export const CardContent = ({ children, className = "" }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

// FormSelect component to replace Material UI Select
export const FormSelect = ({
  label,
  id,
  value,
  onChange,
  options = [],
  className = "",
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// DataTable component to replace Material UI Table
export const DataTable = ({ columns, data, className = "" }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.className || ""
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-6 py-4 whitespace-nowrap ${
                    column.cellClassName || ""
                  }`}
                >
                  {column.cell ? column.cell(row, rowIndex) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// StatusChip component to replace Material UI Chip
export const StatusChip = ({ label, color = "gray", className = "" }) => {
  const colorClasses = {
    primary: "bg-indigo-100 text-indigo-800",
    secondary: "bg-purple-100 text-purple-800",
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]} ${className}`}
    >
      {label}
    </span>
  );
};

// Loading indicator component to replace Material UI CircularProgress
export const LoadingIndicator = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex justify-center items-center p-8">
      <Loader2
        className={`${sizeClasses[size]} text-indigo-600 animate-spin`}
      />
    </div>
  );
};

// Summary card component for report metrics
export const MetricCard = ({ title, value, trend = null, className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-5 ${className}`}>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {trend && (
        <p
          className={`text-sm mt-1 ${
            trend.positive ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend.positive ? "+" : ""}
          {trend.value}
        </p>
      )}
    </div>
  );
};

// Date picker wrapper (Basic version since we can't implement full datepicker easily)
export const DateInput = ({ label, value, onChange, id, className = "" }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        type="date"
        id={id}
        value={
          value instanceof Date ? value.toISOString().split("T")[0] : value
        }
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
};

// Button component
export const Button = ({
  children,
  onClick,
  variant = "default",
  icon,
  className = "",
}) => {
  const variantClasses = {
    default: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${variantClasses[variant]} transition-colors ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// Divider component
export const Divider = ({ className = "" }) => {
  return <hr className={`my-6 border-gray-200 ${className}`} />;
};
