import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination Component
 * Displays pagination controls for navigating between pages
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current active page (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Function to call when page changes
 * @param {boolean} props.showFirstLast - Whether to show first/last buttons
 * @param {number} props.siblingsCount - Number of siblings to show on either side of current page
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.align - Alignment of pagination: 'left', 'center', or 'right'
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showFirstLast = false,
  siblingsCount = 1,
  className = "",
  align = "left",
}) => {
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveSiblingsCount = isMobile ? 0 : siblingsCount;

  // Handle page changes
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    onPageChange(page);
  };

  // Generate the array of page numbers to display
  const getPageNumbers = () => {
    if (totalPages <= (isMobile ? 3 : 7)) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always include first and last page
    const firstPage = 1;
    const lastPage = totalPages;

    // Calculate the start and end of the siblings
    const leftSiblingIndex = Math.max(currentPage - effectiveSiblingsCount, firstPage);
    const rightSiblingIndex = Math.min(currentPage + effectiveSiblingsCount, lastPage);

    // Include a dot indicator if there's a gap
    const shouldShowLeftDots = leftSiblingIndex > firstPage + 1;
    const shouldShowRightDots = rightSiblingIndex < lastPage - 1;

    // Build the page numbers array
    if (!shouldShowLeftDots && shouldShowRightDots) {
      // Show more pages at start, dots at end
      const leftItemCount = isMobile ? 2 : 5;
      const leftRange = Array.from({ length: Math.min(leftItemCount, lastPage) }, (_, i) => i + 1);

      return [...leftRange, "...", lastPage];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      // Show dots at start, more pages at end
      const rightItemCount = isMobile ? 2 : 5;
      const rightRange = Array.from(
        { length: Math.min(rightItemCount, lastPage) },
        (_, i) => lastPage - Math.min(rightItemCount, lastPage) + i + 1
      );

      return [firstPage, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      // Show dots at both ends
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );

      return [firstPage, "...", ...middleRange, "...", lastPage];
    }

    // Default case
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  const pageNumbers = getPageNumbers();

  // Don't render if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // Determine alignment class based on the align prop
  const alignmentClass =
    {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    }[align] || "justify-start";

  return (
    <nav
      className={`flex items-center space-x-0.5 sm:space-x-1 ${alignmentClass} ${className}`}
      aria-label="Pagination"
    >
      {/* Previous Page Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`relative inline-flex items-center rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium ${
          currentPage === 1
            ? "text-gray-400 cursor-not-allowed bg-gray-100"
            : "text-gray-700 hover:bg-gray-200 border border-gray-300"
        }`}
      >
        <ChevronLeft size={isMobile ? 14 : 16} className="sm:mr-1" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="relative inline-flex items-center px-1.5 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700"
            >
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
            className={`relative inline-flex items-center rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium ${
              currentPage === page
                ? "bg-indigo-600 text-white hover:bg-indigo-700 transform scale-105 sm:scale-110 shadow-md"
                : "text-gray-700 hover:bg-gray-100 border border-transparent"
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* Next Page Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`relative inline-flex items-center rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium ${
          currentPage === totalPages
            ? "text-gray-400 cursor-not-allowed bg-gray-100"
            : "text-gray-700 hover:bg-gray-200 border border-gray-300"
        }`}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={isMobile ? 14 : 16} className="sm:ml-1" />
      </button>
    </nav>
  );
};

export default Pagination;
