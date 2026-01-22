import React, { createContext, useContext, useState } from "react";
import { toast } from "react-hot-toast";

// Create the context
const ToastContext = createContext();

// Create a provider component
export const ToastProvider = ({ children }) => {
  // Function to show toast notifications
  const showToast = (message, type = "default", options = {}) => {
    const defaultOptions = {
      duration: 3000,
      position: "top-right",
    };

    const mergedOptions = { ...defaultOptions, ...options };

    switch (type) {
      case "success":
        toast.success(message, mergedOptions);
        break;
      case "error":
        toast.error(message, mergedOptions);
        break;
      case "loading":
        return toast.loading(message, mergedOptions);
      default:
        toast(message, mergedOptions);
    }
  };

  // Dismiss a specific toast
  const dismissToast = (toastId) => {
    toast.dismiss(toastId);
  };

  // Dismiss all toasts
  const dismissAllToasts = () => {
    toast.dismiss();
  };

  // Define the context value
  const contextValue = {
    showToast,
    dismissToast,
    dismissAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

// Custom hook for using the toast context
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};
