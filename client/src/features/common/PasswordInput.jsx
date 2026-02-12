import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
  forgotPasswordLink,
  className = "",
  error,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        {forgotPasswordLink && (
          <a
            href={forgotPasswordLink}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Lupa password?
          </a>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
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
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default PasswordInput;
