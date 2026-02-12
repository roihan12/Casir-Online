import React from "react";

const Input = ({
  id,
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
  className = "",
  error,
  ...props
}) => {
  return (
    <div className="mb-5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`w-full px-4 py-3 rounded-lg border ${
          error ? "border-red-500" : "border-gray-300"
        } focus:outline-none focus:ring-2 ${
          error ? "focus:ring-red-400" : "focus:ring-indigo-400"
        } ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
