import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger" | "info";
  showLabel?: boolean;
  label?: string;
  indeterminate?: boolean;
  striped?: boolean;
  animated?: boolean;
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantMap = {
  default: "bg-primary-600",
  success: "bg-emerald-600",
  warning: "bg-amber-500",
  danger: "bg-red-600",
  info: "bg-blue-600",
};

function getPercentColor(percent: number): string {
  if (percent >= 80) return "bg-emerald-600";
  if (percent >= 50) return "bg-primary-600";
  if (percent >= 25) return "bg-amber-500";
  return "bg-red-600";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = "md",
      variant,
      showLabel = false,
      label,
      indeterminate = false,
      striped = false,
      animated = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const barColor = variant
      ? variantMap[variant]
      : getPercentColor(percentage);

    return (
      <div className="w-full" ref={ref} {...props}>
        {(showLabel || label) && (
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label || "Progress"}
            </span>
            {showLabel && (
              <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(
            "w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
            sizeMap[size],
            className
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              indeterminate
                ? "w-full animate-indeterminate"
                : barColor,
              striped &&
                "bg-stripes",
              striped && animated && "animate-stripes"
            )}
            style={indeterminate ? undefined : { width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  showLabel?: boolean;
  className?: string;
}

const circVariantMap = {
  default: "stroke-primary-600",
  success: "stroke-emerald-600",
  warning: "stroke-amber-500",
  danger: "stroke-red-600",
  info: "stroke-blue-600",
};

function CircularProgress({
  value = 0,
  max = 100,
  size = 80,
  strokeWidth = 6,
  variant = "default",
  showLabel = true,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-200 dark:stroke-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-300",
            circVariantMap[variant]
          )}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-sm font-medium text-gray-700 dark:text-gray-300">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

export { Progress, CircularProgress };
