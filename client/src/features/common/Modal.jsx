import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}) => {
  const modalRef = useRef(null);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        isOpen
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine modal width based on size prop
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  const modalSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl ${modalSizeClass} w-full animate-fadeIn`}
      >
        {/* Modal Header */}
        {title && (
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Content - Added consistent padding */}
        <div className={`px-6 py-4 ${title ? "" : "pt-6"}`}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
