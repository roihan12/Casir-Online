import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Spinner Component
 * A versatile loading spinner with customizable size and color
 *
 * @param {Object} props
 * @param {string} props.size - Size of the spinner (sm, md, lg, xl)
 * @param {string} props.color - Color of the spinner (primary, gray, white)
 * @param {string} props.className - Additional CSS classes
 */
const Spinner = ({ size = "md", color = "primary", className = "" }) => {
  // Map sizes to classes
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  // Map colors to classes
  const colorClasses = {
    primary: "text-indigo-600",
    gray: "text-gray-500",
    white: "text-white",
  };

  // Get the appropriate classes based on size and color
  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const spinnerColor = colorClasses[color] || colorClasses.primary;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin ${spinnerSize} ${spinnerColor}`} />
    </div>
  );
};

export default Spinner;
