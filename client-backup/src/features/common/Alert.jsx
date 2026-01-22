import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

const Alert = ({ type = "info", message, className = "" }) => {
  const typeConfig = {
    success: {
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      icon: <CheckCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />,
    },
    error: {
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      icon: <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />,
    },
    warning: {
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      icon: <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />,
    },
    info: {
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      icon: <Info size={18} className="mr-2 mt-0.5 flex-shrink-0" />,
    },
  };

  const { bgColor, textColor, icon } = typeConfig[type];

  return (
    <div
      className={`mb-4 ${bgColor} ${textColor} p-3 rounded-lg flex items-start ${className}`}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
};

export default Alert;
