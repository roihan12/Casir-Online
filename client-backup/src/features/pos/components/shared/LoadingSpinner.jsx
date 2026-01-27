import React from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ 
  size = "default",
  text = "Memuat...",
  className = "",
  fullScreen = false,
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-6 h-6",
    large: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const textSizeClasses = {
    small: "text-sm",
    default: "text-base",
    large: "text-lg",
    xl: "text-xl",
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 
        className={`animate-spin text-indigo-600 ${sizeClasses[size]}`} 
        size={size === 'small' ? 16 : size === 'default' ? 24 : size === 'large' ? 32 : 48}
      />
      {text && (
        <p className={`mt-3 text-gray-600 font-medium ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;