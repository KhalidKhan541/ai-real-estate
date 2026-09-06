import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode;
  items: {
    label: string;
    href?: string;
    icon?: React.ReactNode;
    isCurrentPage?: boolean;
  }[];
  maxItems?: number;
  collapseAfter?: number;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      className,
      separator = <ChevronRight className="h-3.5 w-3.5 text-gray-400" />,
      items,
      maxItems,
      collapseAfter = 2,
      ...props
    },
    ref
  ) => {
    const [expanded, setExpanded] = React.useState(false);

    const shouldCollapse =
      maxItems && items.length > maxItems && !expanded;
    const displayItems = shouldCollapse
      ? [
          ...items.slice(0, collapseAfter),
          { label: "...", isOverflow: true } as const,
          ...items.slice(items.length - (maxItems - collapseAfter)),
        ]
      : items;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center flex-wrap", className)}
        {...props}
      >
        <ol className="flex items-center flex-wrap gap-1">
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;
            const isOverflow = "isOverflow" in item && item.isOverflow;

            if (isOverflow) {
              return (
                <li key="overflow" className="flex items-center gap-1">
                  <span>{separator}</span>
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Show all breadcrumbs"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </li>
              );
            }

            return (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && <span>{separator}</span>}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                    )}
                  >
                    {item.icon && (
                      <span className="shrink-0">{item.icon}</span>
                    )}
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-sm",
                      isLast
                        ? "font-medium text-gray-900 dark:text-gray-100"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.icon && (
                      <span className="shrink-0">{item.icon}</span>
                    )}
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);
Breadcrumb.displayName = "Breadcrumb";

export { Breadcrumb };
export type { BreadcrumbProps };
