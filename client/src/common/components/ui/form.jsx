import * as React from "react"
import { useWatch } from "react-hook-form";
import { cn } from "@common/utils/cn";

// ---------------------------------------------------------------------------
// Context — allows FormMessage to auto-display field errors from FormField
// ---------------------------------------------------------------------------
const FormFieldContext = React.createContext(null);

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

const Form = React.forwardRef(({ className, ...props }, ref) => (
  <form
    ref={ref}
    className={cn("space-y-4", className)}
    {...props}
  />
))
Form.displayName = "Form"

const FormItem = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}
  />
))
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-medium leading-none text-gray-700", className)}
    {...props}
  />
))
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-1", className)}
    {...props}
  />
))
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-gray-500", className)}
    {...props}
  />
))
FormDescription.displayName = "FormDescription"

/**
 * FormMessage — renders error text.
 * 
 * Priority:
 *  1. Explicit `children` prop
 *  2. `error` from the nearest FormFieldContext (auto-wired by FormField)
 * 
 * Renders nothing when there's no error to display.
 */
const FormMessage = React.forwardRef(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(FormFieldContext);
  const message = children || ctx?.error?.message;

  if (!message) return null;

  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-red-500", className)}
      {...props}
    >
      {message}
    </p>
  );
})
FormMessage.displayName = "FormMessage"

// ---------------------------------------------------------------------------
// FormField — bridges react-hook-form with our custom form primitives
//
// ✅ Uses useWatch for reactive value subscription
// ✅ Uses setValue for onChange (handles both event objects and direct values)
// ✅ Provides FormFieldContext so FormMessage auto-displays errors
// ✅ No register/unregister — avoids race condition on step wizard unmount
// ---------------------------------------------------------------------------
const FormField = ({ name, control, render, defaultValue }) => {
  // Subscribe to this specific field's value changes
  const value = useWatch({ control, name, defaultValue });

  const error = control?.formState?.errors?.[name];

  return (
    <FormFieldContext.Provider value={{ error }}>
      {render({
        field: {
          name,
          value: value ?? defaultValue,
          onChange: (e) => {
            const newValue = e?.target !== undefined ? e.target.value : e;
            control?.setValue?.(name, newValue, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true,
            });
          },
          onBlur: () => {
            control?.trigger?.(name);
          },
        },
        fieldState: {
          invalid: !!error,
          error,
        },
        formState: control?.formState,
      })}
    </FormFieldContext.Provider>
  );
};
FormField.displayName = "FormField";

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}