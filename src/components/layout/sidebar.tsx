"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  Building2,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

function Sidebar({ children, className }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden dark:bg-gray-800"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-900",
          collapsed ? "w-16" : "w-64",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-gray-200 px-4 dark:border-gray-700",
            collapsed && "justify-center px-0"
          )}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                AI Estate
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Building2 className="h-4 w-4 text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-md p-1 text-gray-400 hover:text-gray-600 lg:hidden dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="flex-1 py-3">
          {children}
        </ScrollArea>

        <div className="hidden border-t border-gray-200 p-3 lg:block dark:border-gray-700">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  active?: boolean;
  collapsed?: boolean;
}

function SidebarNavItem({
  href,
  icon,
  label,
  badge,
  active,
  collapsed,
}: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? label : undefined}
    >
      <span className={cn("shrink-0", active ? "text-primary-600 dark:text-primary-400" : "")}>
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge && (
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                active
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

interface SidebarSectionProps {
  title?: string;
  collapsed?: boolean;
  children: React.ReactNode;
}

function SidebarSection({ title, collapsed, children }: SidebarSectionProps) {
  return (
    <div className="px-3 py-1">
      {title && !collapsed && (
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {title}
        </p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen lg:pl-64 transition-all duration-300">
      {children}
    </main>
  );
}

export { Sidebar, SidebarNavItem, SidebarSection, MainContent };
