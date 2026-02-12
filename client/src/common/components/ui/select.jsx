import React, { createContext, useContext, useState, useEffect, useRef, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@common/utils/cn";

const SelectContext = createContext(null);

const useSelect = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select");
  }
  return context;
};

const Select = ({ children, value, onChange, onValueChange, defaultValue, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue);
  const [selectedLabel, setSelectedLabel] = useState("");
  const containerRef = useRef(null);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync internal state with external value
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleSelect = (val, label) => {
    setSelectedValue(val);
    setSelectedLabel(label);
    setOpen(false);
    if (onChange) onChange(val);
    if (onValueChange) onValueChange(val);
  };

  return (
    <SelectContext.Provider value={{ 
      open, 
      setOpen, 
      selectedValue, 
      setSelectedValue, 
      handleSelect, 
      selectedLabel, 
      setSelectedLabel,
      disabled 
    }}>
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = forwardRef(({ className, children, ...props }, ref) => {
  const { open, setOpen, disabled, selectedLabel } = useSelect();
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => !disabled && setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-left shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400",
        className
      )}
      disabled={disabled}
      {...props}
    >
      <span className={cn("truncate flex-grow", !selectedLabel && !children && "text-gray-400")}>
        {selectedLabel || children || "Select..."}
      </span>
      <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
    </button>
  );
});

const SelectValue = ({ placeholder, children, className }) => {
  const { selectedLabel } = useSelect();
  return (
    <span className={cn("truncate block", !selectedLabel && "text-gray-400", className)}>
      {selectedLabel || children || placeholder}
    </span>
  );
};

const SelectContent = ({ className, children, ...props }) => {
  const { open } = useSelect();
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in slide-in-from-top-1 duration-200",
        className
      )}
      {...props}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
};

const SelectItem = forwardRef(({ children, value, disabled = false, className, ...props }, ref) => {
  const { selectedValue, handleSelect, setSelectedLabel } = useSelect();
  const isSelected = selectedValue === value;

  // Sync initial label if selected
  useEffect(() => {
    if (isSelected) {
      setSelectedLabel(children);
    }
  }, [isSelected, children, setSelectedLabel]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full items-center px-3 py-2 text-sm cursor-pointer select-none transition-colors",
        isSelected ? "bg-indigo-50 text-indigo-900 font-medium" : "text-gray-700 hover:bg-gray-50",
        disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
        className
      )}
      onClick={() => !disabled && handleSelect(value, children)}
      {...props}
    >
      <span className="flex-grow truncate">{children}</span>
      {isSelected && <Check className="ml-2 h-4 w-4 text-indigo-600 shrink-0" />}
    </div>
  );
});

export { 
  Select, 
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent 
};
