import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
  shape?: "circle" | "square";
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const statusColorMap = {
  online: "bg-emerald-500",
  offline: "bg-gray-400",
  away: "bg-amber-500",
  busy: "bg-red-500",
};

const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(
  (
    {
      className,
      size = "md",
      status,
      shape = "circle",
      ...props
    },
    ref
  ) => (
    <div className="relative inline-flex shrink-0">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden",
          sizeMap[size],
          shape === "circle" ? "rounded-full" : "rounded-lg",
          className
        )}
        {...props}
      />
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900",
            statusColorMap[status],
            size === "xs" && "h-1.5 w-1.5",
            size === "sm" && "h-2 w-2",
            (size === "md" || size === "lg") && "h-2.5 w-2.5",
            size === "xl" && "h-3.5 w-3.5"
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  )
);
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-600 font-medium dark:bg-gray-700 dark:text-gray-300",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

interface AvatarGroupProps {
  avatars: {
    src?: string;
    alt?: string;
    fallback?: string;
  }[];
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

function AvatarGroup({ avatars, max = 3, size = "md" }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, i) => (
        <Avatar
          key={i}
          size={size}
          className="ring-2 ring-white dark:ring-gray-900"
        >
          <AvatarImage src={avatar.src} alt={avatar.alt} />
          <AvatarFallback>{avatar.fallback || "?"}</AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <Avatar
          size={size}
          className="ring-2 ring-white dark:ring-gray-900"
        >
          <AvatarFallback className="bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200">
            +{remaining}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };
