import React, { forwardRef, useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

const Select = forwardRef(({
  children,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className,
  ...props
}, ref) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [selectedLabel, setSelectedLabel] = useState("");
  const selectRef = useRef(null);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update selected value when prop changes
  useEffect(() => {
    setSelectedValue(value);
    
    // Find the label for the selected value
    React.Children.forEach(children, child => {
      if (child.props.value === value) {
        setSelectedLabel(child.props.children);
      }
    });
  }, [value, children]);

  // Handle selection
  const handleSelect = (value, label) => {
    setSelectedValue(value);
    setSelectedLabel(label);
    setOpen(false);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div 
      ref={selectRef}
      className={cn("relative", className)} 
      {...props}
    >
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-left",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className
        )}
        disabled={disabled}
        ref={ref}
      >
        <span className={selectedLabel ? "" : "text-gray-400"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {React.Children.map(children, child => 
              React.cloneElement(child, {
                onSelect: handleSelect,
                isSelected: child.props.value === selectedValue
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
});

Select.displayName = "Select";

const SelectItem = forwardRef(({ 
  children, 
  value, 
  onSelect, 
  isSelected,
  disabled = false,
  className,
  ...props 
}, ref) => {
  return (
    <li
      ref={ref}
      className={cn(
        "relative flex items-center px-3 py-2 text-sm cursor-pointer select-none",
        isSelected ? "bg-indigo-50 text-indigo-900" : "hover:bg-gray-50",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
      onClick={() => !disabled && onSelect && onSelect(value, children)}
      {...props}
    >
      <span className="flex-grow">{children}</span>
      {isSelected && (
        <Check className="h-4 w-4 text-indigo-600" />
      )}
    </li>
  );
});

SelectItem.displayName = "SelectItem";

// These are additional components to maintain compatibility with the previous Radix UI implementation
const SelectTrigger = forwardRef(({ className, children, ...props }, ref) => {
  // This is just a wrapper around the button in the Select component
  // It's here for backward compatibility
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-left",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});

SelectTrigger.displayName = "SelectTrigger";

const SelectValue = forwardRef(({ className, placeholder, ...props }, ref) => {
  // This is just a wrapper around the span in the Select component
  // It's here for backward compatibility
  return (
    <span
      ref={ref}
      className={cn("text-sm", className)}
      {...props}
    >
      {props.children || placeholder}
    </span>
  );
});

SelectValue.displayName = "SelectValue";

const SelectContent = forwardRef(({ className, children, ...props }, ref) => {
  // This is just a wrapper around the div in the Select component
  // It's here for backward compatibility
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto",
        className
      )}
      {...props}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
});

SelectContent.displayName = "SelectContent";

export { 
  Select, 
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent 
};
