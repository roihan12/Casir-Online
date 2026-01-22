import React, { forwardRef, useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const Dialog = ({ children, open, onOpenChange }) => {
  return (
    <>{open && children}</>
  );
};

const DialogTrigger = forwardRef(({ className, children, onClick, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={className}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
));

DialogTrigger.displayName = "DialogTrigger";

const DialogOverlay = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 transition-opacity duration-200",
      className
    )}
    {...props}
  />
));

DialogOverlay.displayName = "DialogOverlay";

const DialogContent = forwardRef(({ className, children, onClose, ...props }, ref) => {
  const contentRef = useRef(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        if (onClose) onClose();
      }
    };
    
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    
    // Prevent body scrolling
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <DialogOverlay onClick={onClose} />
      <div
        ref={contentRef}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg transition-all duration-200 sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
});

DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);

DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);

DialogFooter.displayName = "DialogFooter";

const DialogTitle = forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));

DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));

DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
};
