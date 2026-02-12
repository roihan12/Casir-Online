import React from "react";

const Button = ({
  type = "button",
  variant = "primary",
  children,
  className = "",
  disabled = false,
  isLoading = false,
  fullWidth = false,
  ...props
}) => {
  const baseClasses =
    "py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass =
    disabled || isLoading ? "opacity-70 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Memproses..." : children}
    </button>
  );
};

export default Button;
