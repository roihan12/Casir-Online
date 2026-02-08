import React, { useMemo } from "react";

/**
 * Pulse Indicator Component
 * Shows activity status with pulsing animation
 * 
 * @param {Date|string} lastActivityAt - Timestamp of last activity
 * @param {boolean} hasActiveShift - Whether there's an active shift
 * @param {string} size - Size of the indicator (sm, md, lg)
 */
const PulseIndicator = ({ 
  lastActivityAt, 
  hasActiveShift = false,
  size = "md" 
}) => {
  const status = useMemo(() => {
    if (!lastActivityAt && !hasActiveShift) {
      return "off"; // No shift, no activity
    }

    if (!lastActivityAt) {
      return hasActiveShift ? "idle" : "off";
    }

    const now = new Date();
    const lastActivity = new Date(lastActivityAt);
    const diffMinutes = (now - lastActivity) / (1000 * 60);

    if (diffMinutes < 5) {
      return "fast"; // Transaksi < 5 menit
    } else if (diffMinutes < 15) {
      return "slow"; // Transaksi < 15 menit
    } else if (hasActiveShift) {
      return "idle"; // Shift aktif tapi idle
    }
    return "off";
  }, [lastActivityAt, hasActiveShift]);

  // Size classes
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const pulseClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const dotSize = sizeClasses[size] || sizeClasses.md;
  const pulseSize = pulseClasses[size] || pulseClasses.md;

  // Status styles
  const statusStyles = {
    fast: {
      dotColor: "bg-green-500",
      pulseColor: "bg-green-400",
      animation: "animate-ping-fast",
    },
    slow: {
      dotColor: "bg-green-500",
      pulseColor: "bg-green-400",
      animation: "animate-ping-slow",
    },
    idle: {
      dotColor: "bg-yellow-500",
      pulseColor: "",
      animation: "",
    },
    off: {
      dotColor: "bg-red-500",
      pulseColor: "",
      animation: "",
    },
  };

  const currentStyle = statusStyles[status] || statusStyles.off;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Pulse ring (only for active states) */}
      {currentStyle.animation && (
        <span
          className={`absolute ${pulseSize} rounded-full ${currentStyle.pulseColor} opacity-75 ${currentStyle.animation}`}
        />
      )}
      {/* Main dot */}
      <span
        className={`relative ${dotSize} rounded-full ${currentStyle.dotColor}`}
      />
    </div>
  );
};

// Add custom styles for pulse animations
const style = document.createElement("style");
style.textContent = `
  @keyframes ping-fast {
    0% {
      transform: scale(1);
      opacity: 0.75;
    }
    75%, 100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
  
  @keyframes ping-slow {
    0% {
      transform: scale(1);
      opacity: 0.75;
    }
    75%, 100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
  
  .animate-ping-fast {
    animation: ping-fast 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  
  .animate-ping-slow {
    animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
`;
if (typeof document !== "undefined" && !document.getElementById("pulse-indicator-styles")) {
  style.id = "pulse-indicator-styles";
  document.head.appendChild(style);
}

export default PulseIndicator;
