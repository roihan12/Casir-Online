import React, { forwardRef, useState, useRef, useEffect, createContext, useContext } from "react";
import { cn } from "@common/utils/cn";

// Context to manage dropdown state
const DropdownMenuContext = createContext({
  open: false,
  setOpen: () => {},
});

const DropdownMenu = ({ children, open: controlledOpen, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  
  const setOpen = (newOpen) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = forwardRef(({ className, children, asChild, onClick, ...props }, ref) => {
  const { open, setOpen } = useContext(DropdownMenuContext);
  
  const handleClick = (e) => {
    if (onClick) onClick(e);
    setOpen(!open);
  };
  
  if (asChild) {
    // If asChild is true, clone the child and add props
    const child = React.Children.only(children);
    return React.cloneElement(child, {
      ref,
      onClick: handleClick,
      className: cn(className, child.props.className),
      'aria-expanded': open,
      ...props
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn("inline-flex justify-center w-full", className)}
      onClick={handleClick}
      aria-expanded={open}
      {...props}
    >
      {children}
    </button>
  );
});

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = forwardRef(({ className, align = "end", children, ...props }, ref) => {
  const { open, setOpen } = useContext(DropdownMenuContext);
  const contentRef = useRef(null);
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && contentRef.current && !contentRef.current.contains(event.target)) {
        // Check if the click was on the trigger (to avoid double toggle)
        // This is a simplified check
        setOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md",
        align === "end" ? "right-0" : "left-0",
        "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
        className
      )}
      {...props}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
});

DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = forwardRef(({ className, children, inset, onClick, ...props }, ref) => {
  const { setOpen } = useContext(DropdownMenuContext);
  
  const handleClick = (e) => {
    if (onClick) onClick(e);
    setOpen(false); // Close dropdown on selection
  };
  
  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = forwardRef(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-100", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
