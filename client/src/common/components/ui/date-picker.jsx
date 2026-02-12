import * as React from "react";
import { forwardRef } from "react";
import ReactDatePicker from "react-datepicker";
import { Calendar } from "lucide-react";
import { cn } from "@common/utils/cn";
import "react-datepicker/dist/react-datepicker.css";

const DatePicker = forwardRef(
  (
    {
      className,
      selected,
      onSelect,
      onChange,
      placeholderText = "Pilih tanggal",
      dateFormat = "dd/MM/yyyy",
      showTimeSelect = false,
      timeFormat = "HH:mm",
      timeIntervals = 15,
      timeCaption = "Waktu",
      isClearable = true,
      disabled = false,
      minDate,
      maxDate,
      ...props
    },
    ref
  ) => {
    // Handle both onSelect and onChange for compatibility
    const handleDateChange = (date) => {
      if (onSelect) onSelect(date);
      if (onChange) onChange(date);
    };

    return (
      <div className={cn("relative", className)}>
        <ReactDatePicker
          ref={ref}
          selected={selected}
          onChange={handleDateChange}
          placeholderText={placeholderText}
          dateFormat={dateFormat}
          showTimeSelect={showTimeSelect}
          timeFormat={timeFormat}
          timeIntervals={timeIntervals}
          timeCaption={timeCaption}
          isClearable={isClearable}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
            "dark:bg-gray-800 dark:border-gray-700 dark:text-white",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          {...props}
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

// Wrapper for DatePickerRange
const DatePickerRange = forwardRef(
  (
    {
      className,
      startDate,
      endDate,
      onChangeStart,
      onChangeEnd,
      startPlaceholder = "Tanggal mulai",
      endPlaceholder = "Tanggal akhir",
      dateFormat = "dd/MM/yyyy",
      isClearable = true,
      disabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("flex space-x-2", className)} ref={ref}>
        <DatePicker
          selected={startDate}
          onChange={onChangeStart}
          placeholderText={startPlaceholder}
          dateFormat={dateFormat}
          isClearable={isClearable}
          disabled={disabled}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          maxDate={endDate}
          className="flex-1"
          {...props}
        />
        <DatePicker
          selected={endDate}
          onChange={onChangeEnd}
          placeholderText={endPlaceholder}
          dateFormat={dateFormat}
          isClearable={isClearable}
          disabled={disabled}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          className="flex-1"
          {...props}
        />
      </div>
    );
  }
);

DatePickerRange.displayName = "DatePickerRange";

export { DatePicker, DatePickerRange };