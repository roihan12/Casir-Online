import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@common/utils/cn";

const Checkbox = React.forwardRef(({ className, checked, defaultChecked, onChange, onCheckedChange, disabled, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(defaultChecked || false);
  
  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);
  
  const handleChange = (e) => {
    if (disabled) return;
    
    const newValue = !isChecked;
    if (checked === undefined) {
      setIsChecked(newValue);
    }
    
    // Call both handlers if they exist
    onChange?.(e);
    onCheckedChange?.(newValue);
  };
  
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        type="checkbox"
        ref={ref}
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <div
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed",
          isChecked && "bg-blue-500 border-blue-500",
          className
        )}
        onClick={disabled ? undefined : handleChange}
      >
        {isChecked && (
          <div className="flex items-center justify-center text-white">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );
});
Checkbox.displayName = "Checkbox"

export { Checkbox }
