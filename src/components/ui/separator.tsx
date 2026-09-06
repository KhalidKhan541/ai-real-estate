import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
    label?: string;
  }
>(
  (
    { className, orientation = "horizontal", decorative = true, label, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-gray-200 dark:bg-gray-700",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

function LabeledSeparator({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      <span className="px-3 text-xs text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
    </div>
  );
}

export { Separator, LabeledSeparator };
