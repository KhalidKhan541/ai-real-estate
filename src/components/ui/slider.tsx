import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  error?: string;
}

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      label,
      showValue = false,
      formatValue,
      error,
      id,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const sliderId = id || React.useId();
    const currentValue = value?.[0] ?? defaultValue?.[0] ?? 0;

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="mb-2 flex items-center justify-between">
            {label && (
              <label
                htmlFor={sliderId}
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
                {formatValue ? formatValue(currentValue) : currentValue}
              </span>
            )}
          </div>
        )}
        <SliderPrimitive.Root
          ref={ref}
          id={sliderId}
          value={value}
          defaultValue={defaultValue}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
          )}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <SliderPrimitive.Range className="absolute h-full bg-primary-600" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary-600 bg-white shadow-md ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-primary-400 dark:bg-gray-900" />
        </SliderPrimitive.Root>
        {error && (
          <p className="mt-1.5 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Slider.displayName = "Slider";

interface DualSliderProps
  extends Omit<SliderProps, "value" | "defaultValue" | "onValueChange"> {
  value?: [number, number];
  defaultValue?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  minStepsBetweenThumbs?: number;
}

const DualSlider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  DualSliderProps
>(
  (
    {
      className,
      label,
      showValue = false,
      formatValue,
      error,
      id,
      value,
      defaultValue,
      onValueChange,
      min = 0,
      max = 100,
      minStepsBetweenThumbs = 1,
      ...props
    },
    ref
  ) => {
    const sliderId = id || React.useId();

    const displayValue = (val: [number, number]) => {
      if (formatValue) {
        return `${formatValue(val[0])} - ${formatValue(val[1])}`;
      }
      return `${val[0]} - ${val[1]}`;
    };

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="mb-2 flex items-center justify-between">
            {label && (
              <label
                htmlFor={sliderId}
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
                {displayValue(value ?? defaultValue ?? [min, max])}
              </span>
            )}
          </div>
        )}
        <SliderPrimitive.Root
          ref={ref}
          id={sliderId}
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange as (val: number[]) => void}
          min={min}
          max={max}
          minStepsBetweenThumbs={minStepsBetweenThumbs}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
          )}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <SliderPrimitive.Range className="absolute h-full bg-primary-600" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary-600 bg-white shadow-md ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-primary-400 dark:bg-gray-900" />
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary-600 bg-white shadow-md ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-primary-400 dark:bg-gray-900" />
        </SliderPrimitive.Root>
        {error && (
          <p className="mt-1.5 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
DualSlider.displayName = "DualSlider";

export { Slider, DualSlider };
