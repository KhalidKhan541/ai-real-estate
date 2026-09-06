import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, Command as CommandIcon } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  children?: React.ReactNode;
}

function CommandPalette({
  open,
  onOpenChange,
  placeholder = "Type a command...",
  children,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 flex items-start justify-center pt-[15vh]">
        <div
          className={cn(
            "w-full max-w-lg rounded-xl border bg-white shadow-2xl dark:bg-gray-900 dark:border-gray-700",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          <div className="flex items-center border-b px-4 dark:border-gray-700">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder={placeholder}
              className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-gray-400"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedIndex((i) => i + 1);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedIndex((i) => Math.max(0, i - 1));
                }
              }}
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-500 sm:inline-flex dark:bg-gray-700 dark:text-gray-400">
              ESC
            </kbd>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return child;
              }
              return child;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommandGroupProps {
  heading?: string;
  children: React.ReactNode;
  className?: string;
}

function CommandGroup({ heading, children, className }: CommandGroupProps) {
  return (
    <div className={cn("mb-2", className)}>
      {heading && (
        <p className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          {heading}
        </p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

interface CommandItemProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  shortcut?: string;
  onSelect?: () => void;
  className?: string;
}

function CommandItem({
  icon,
  label,
  description,
  shortcut,
  onSelect,
  className,
}: CommandItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
    >
      {icon && (
        <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      )}
      <div className="flex-1 text-left">
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </div>
        )}
      </div>
      {shortcut && (
        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

function CommandEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
      {children}
    </div>
  );
}

function CommandSeparator() {
  return <div className="my-2 h-px bg-gray-200 dark:bg-gray-700" />;
}

interface CommandTriggerProps {
  shortcut?: string;
  onClick?: () => void;
  placeholder?: string;
  className?: string;
}

function CommandTrigger({
  shortcut = "⌘K",
  onClick,
  placeholder = "Search...",
  className,
}: CommandTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-lg border bg-white px-3 text-sm text-gray-500 shadow-sm transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700",
        className
      )}
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">{placeholder}</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-500 sm:inline-flex dark:bg-gray-700 dark:text-gray-400">
        {shortcut}
      </kbd>
    </button>
  );
}

export {
  CommandPalette,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator,
  CommandTrigger,
};
