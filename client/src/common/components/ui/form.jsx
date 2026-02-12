import * as React from "react"
import { cn } from "@common/utils/cn";

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

const FormMessage = React.forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm font-medium text-red-500", className)}
    {...props}
  >
    {children}
  </p>
))
FormMessage.displayName = "FormMessage"

const FormField = React.forwardRef(({ name, control, render, defaultValue, rules, ...props }, ref) => {
  return (
    <React.Fragment>
      {render({
        field: {
          name,
          value: defaultValue,
          onChange: (e) => {
            // Handle both direct value and event objects
            const value = e && e.target ? e.target.value : e;
            if (control && control.setValue) {
              control.setValue(name, value, { shouldValidate: true });
            }
            return value;
          },
          onBlur: () => {
            if (control && control.trigger) {
              control.trigger(name);
            }
          },
          ref,
        },
        fieldState: {
          invalid: control?.formState?.errors?.[name] ? true : false,
          error: control?.formState?.errors?.[name],
        },
        formState: control?.formState,
      })}
    </React.Fragment>
  );
});

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
