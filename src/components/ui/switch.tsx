import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
  error?: string;
  labelClassName?: string;
}

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(
  (
    {
      className,
      label,
      description,
      error,
      labelClassName,
      id,
      ...props
    },
    ref
  ) => {
    const switchId = id || React.useId();

    return (
      <div className="flex items-start gap-3">
        <SwitchPrimitive.Root
          ref={ref}
          id={switchId}
          className={cn(
            "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "data-[state=checked]:bg-primary-600 data-[state=unchecked]:bg-gray-200",
            "dark:data-[state=unchecked]:bg-gray-700",
            error && "focus-visible:ring-red-500",
            className
          )}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
              "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
            )}
          />
        </SwitchPrimitive.Root>
        {(label || description || error) && (
          <div className="flex flex-col gap-0.5 leading-none pt-0.5">
            {label && (
              <label
                htmlFor={switchId}
                className={cn(
                  "text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none",
                  labelClassName
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
