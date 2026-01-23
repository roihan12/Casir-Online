import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@common/utils/cn";

const Pagination = React.forwardRef(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("flex w-full items-center justify-center", className)}
    role="navigation"
    aria-label="pagination"
    {...props}
  />
))
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("flex items-center", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

const PaginationLink = React.forwardRef(
  ({ className, isActive, size = "icon", ...props }, ref) => (
    <a
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-9 items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100",
        isActive && "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600",
        size === "sm" && "h-8 w-8 px-0",
        size === "lg" && "h-10 px-4",
        size === "icon" && "h-9 w-9 px-0",
        className
      )}
      {...props}
    />
  )
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = React.forwardRef(
  ({ className, disabled, ...props }, ref) => (
    <PaginationItem>
      <PaginationLink
        ref={ref}
        aria-label="Go to previous page"
        size="default"
        className={cn(
          "gap-1 pl-2.5",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        {...props}
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
      </PaginationLink>
    </PaginationItem>
  )
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef(
  ({ className, disabled, ...props }, ref) => (
    <PaginationItem>
      <PaginationLink
        ref={ref}
        aria-label="Go to next page"
        size="default"
        className={cn(
          "gap-1 pr-2.5",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        {...props}
      >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
      </PaginationLink>
    </PaginationItem>
  )
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = React.forwardRef(({ className, ...props }, ref) => (
  <PaginationItem>
    <span
      ref={ref}
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  </PaginationItem>
))
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}