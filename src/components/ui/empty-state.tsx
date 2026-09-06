import * as React from "react";
import { cn } from "@/lib/utils";
import { Inbox, FileX, SearchX, AlertCircle, Home } from "lucide-react";
import { Button } from "./button";

const emptyStateIcons = {
  inbox: Inbox,
  "file-not-found": FileX,
  "no-results": SearchX,
  error: AlertCircle,
  "no-data": Home,
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  iconKey?: keyof typeof emptyStateIcons;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

function EmptyState({
  icon,
  iconKey = "inbox",
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const IconComponent = emptyStateIcons[iconKey];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" && "py-8",
        size === "md" && "py-12",
        size === "lg" && "py-16",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800",
          size === "sm" && "h-12 w-12",
          size === "md" && "h-16 w-16",
          size === "lg" && "h-20 w-20"
        )}
      >
        {icon || (
          <IconComponent
            className={cn(
              "text-gray-400 dark:text-gray-500",
              size === "sm" && "h-6 w-6",
              size === "md" && "h-8 w-8",
              size === "lg" && "h-10 w-10"
            )}
          />
        )}
      </div>
      <h3
        className={cn(
          "mt-4 font-semibold text-gray-900 dark:text-gray-100",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-lg"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "mt-1 text-gray-500 dark:text-gray-400",
            size === "sm" && "text-xs max-w-[240px]",
            size === "md" && "text-sm max-w-[320px]",
            size === "lg" && "text-sm max-w-[400px]"
          )}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-4 flex items-center gap-2">
          {action && (
            <Button
              variant={action.variant || "default"}
              onClick={action.onClick}
              size={size === "sm" ? "sm" : "md"}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              size={size === "sm" ? "sm" : "md"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface PropertyEmptyStateProps {
  type?: "no-listings" | "no-favorites" | "no-results" | "no-appointments";
  onAction?: () => void;
}

function PropertyEmptyState({
  type = "no-listings",
  onAction,
}: PropertyEmptyStateProps) {
  const content = {
    "no-listings": {
      iconKey: "no-data" as const,
      title: "No properties listed yet",
      description:
        "Start adding properties to your portfolio to track and manage them here.",
      actionLabel: "Add Property",
    },
    "no-favorites": {
      iconKey: "inbox" as const,
      title: "No saved properties",
      description:
        "Properties you save will appear here for quick access.",
      actionLabel: "Browse Properties",
    },
    "no-results": {
      iconKey: "no-results" as const,
      title: "No properties found",
      description:
        "Try adjusting your search filters or browse all available properties.",
      actionLabel: "Clear Filters",
    },
    "no-appointments": {
      iconKey: "inbox" as const,
      title: "No upcoming appointments",
      description:
        "Schedule property viewings to see them appear here.",
      actionLabel: "Schedule Viewing",
    },
  };

  const c = content[type];

  return (
    <EmptyState
      iconKey={c.iconKey}
      title={c.title}
      description={c.description}
      action={
        onAction
          ? {
              label: c.actionLabel,
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

export { EmptyState, PropertyEmptyState };
