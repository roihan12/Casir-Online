import React from "react";

/**
 * Empty State Component
 * Displays a message when no data is available
 * @param {Object} props
 * @param {string} props.title - The title text
 * @param {string} props.description - The description text
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {React.ReactNode} props.action - Optional action button
 * @param {string} props.className - Additional classes
 */
const EmptyState = ({ title, description, icon, action, className = "" }) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {icon && <div className="mx-auto flex justify-center mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;
