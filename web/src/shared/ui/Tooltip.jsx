import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Tooltip Component
 * A beautiful, animated tooltip with multiple positions
 */
const Tooltip = ({ 
  children, 
  content, 
  position = 'top', 
  delay = 200,
  className = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    let top, left;
    
    switch (position) {
      case 'bottom':
        top = rect.bottom + scrollY + 8;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - 8;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 8;
        break;
      case 'top':
      default:
        top = rect.top + scrollY - 8;
        left = rect.left + scrollX + rect.width / 2;
        break;
    }
    
    setCoords({ top, left });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-gray-800';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-gray-800';
      case 'top':
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-800';
    }
  };

  if (!content) return children;

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999] pointer-events-none animate-fadeIn"
          style={{
            top: position === 'top' ? coords.top : position === 'bottom' ? coords.top : coords.top,
            left: coords.left,
            transform: position === 'top' 
              ? 'translate(-50%, -100%)' 
              : position === 'bottom' 
              ? 'translate(-50%, 0)' 
              : position === 'left'
              ? 'translate(-100%, -50%)'
              : 'translate(0, -50%)',
          }}
        >
          <div className="relative">
            <div className="px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg max-w-xs whitespace-nowrap">
              {content}
            </div>
            {/* Arrow */}
            <div 
              className={`absolute w-2 h-2 bg-gray-800 rotate-45 ${
                position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                'left-[-4px] top-1/2 -translate-y-1/2'
              }`}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tooltip;
