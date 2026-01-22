import React, { forwardRef, createContext, useContext, useState, useEffect } from "react";
import { Circle } from "lucide-react";
import { cn } from "../../lib/utils";

const RadioGroupContext = createContext({
  value: undefined,
  onChange: () => {},
  name: undefined,
});

const RadioGroup = forwardRef(({ 
  className, 
  value, 
  defaultValue, 
  name,
  onChange,
  children,
  ...props 
}, ref) => {
  const [selectedValue, setSelectedValue] = useState(value || defaultValue);
  
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);
  
  const handleChange = (newValue) => {
    if (value === undefined) {
      setSelectedValue(newValue);
    }
    if (onChange) {
      onChange(newValue);
    }
  };
  
  return (
    <RadioGroupContext.Provider value={{ value: selectedValue, onChange: handleChange, name }}>
      <div 
        ref={ref}
        className={cn("grid gap-2", className)}
        role="radiogroup"
        {...props}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
});

RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = forwardRef(({ 
  className, 
  value,
  id,
  disabled = false,
  children,
  ...props 
}, ref) => {
  const { value: groupValue, onChange, name } = useContext(RadioGroupContext);
  const checked = value === groupValue;
  const itemId = id || `radio-${value}`;
  
  return (
    <div className="flex items-center space-x-2">
      <input
        ref={ref}
        type="radio"
        id={itemId}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only"
        {...props}
      />
      <label 
        htmlFor={itemId}
        className="flex items-center cursor-pointer"
        onClick={() => !disabled && onChange(value)}
      >
        <span 
          className={cn(
            "flex items-center justify-center w-4 h-4 rounded-full border",
            checked 
              ? "border-indigo-600 bg-indigo-600" 
              : "border-gray-300 bg-white",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            className
          )}
        >
          {checked && (
            <Circle className="h-2.5 w-2.5 text-white fill-white" />
          )}
        </span>
        {children && (
          <span className="ml-2 text-sm font-medium text-gray-900">
            {children}
          </span>
        )}
      </label>
    </div>
  );
});

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
