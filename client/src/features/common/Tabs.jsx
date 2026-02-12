import React from "react";

/**
 * Tabs Component
 * @param {Object} props
 * @param {Array} props.tabs - Array of tab objects with id, label, and optional icon
 * @param {string} props.activeTab - ID of the active tab
 * @param {Function} props.onChange - Function to call when tab changes
 * @param {string} props.className - Additional classes
 */
const Tabs = ({ tabs, activeTab, onChange, className = "" }) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-4 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.onClick) {
                  tab.onClick();
                } else {
                  onChange(tab.id);
                }
              }}
              className={`
                group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${
                  isActive
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.icon && (
                <span
                  className={`mr-2 ${
                    isActive
                      ? "text-indigo-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                >
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Tabs;
