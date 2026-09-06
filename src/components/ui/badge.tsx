import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300",
        secondary:
          "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        destructive:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        outline: "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        purple:
          "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        pink:
          "border-transparent bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  leftIcon?: React.ReactNode;
}

function Badge({
  className,
  variant,
  size,
  dot,
  removable,
  onRemove,
  leftIcon,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "mr-1.5 h-1.5 w-1.5 rounded-full",
            variant === "default" && "bg-primary-600 dark:bg-primary-400",
            variant === "secondary" && "bg-gray-600 dark:bg-gray-400",
            variant === "destructive" && "bg-red-600 dark:bg-red-400",
            variant === "outline" && "bg-gray-600 dark:bg-gray-400",
            variant === "success" && "bg-emerald-600 dark:bg-emerald-400",
            variant === "warning" && "bg-amber-600 dark:bg-amber-400",
            variant === "info" && "bg-blue-600 dark:bg-blue-400",
            variant === "purple" && "bg-purple-600 dark:bg-purple-400",
            variant === "pink" && "bg-pink-600 dark:bg-pink-400"
          )}
        />
      )}
      {leftIcon && <span className="mr-1 inline-flex shrink-0">{leftIcon}</span>}
      {children}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 -mr-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label="Remove"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };
