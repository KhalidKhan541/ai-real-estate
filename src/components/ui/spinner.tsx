import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "gray" | "white";
}

const sizeMap = {
  xs: "h-3 w-3 border-[1.5px]",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
  xl: "h-12 w-12 border-4",
};

const colorMap = {
  primary: "border-primary-600 border-t-transparent",
  gray: "border-gray-400 border-t-transparent",
  white: "border-white/30 border-t-white",
};

function Spinner({ className, size = "md", color = "primary", ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("animate-spin rounded-full", sizeMap[size], colorMap[color], className)}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingOverlayProps {
  loading: boolean;
  children?: React.ReactNode;
  text?: string;
  className?: string;
}

function LoadingOverlay({ loading, children, text, className }: LoadingOverlayProps) {
  if (!loading) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="flex flex-col items-center gap-2">
          <Spinner size="lg" />
          {text && (
            <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface PageLoadingProps {
  text?: string;
  fullScreen?: boolean;
}

function PageLoading({ text = "Loading...", fullScreen = true }: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen
          ? "fixed inset-0 z-50 bg-white dark:bg-gray-900"
          : "min-h-[400px]"
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner size="xl" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {text}
        </p>
      </div>
    </div>
  );
}

export { Spinner, LoadingOverlay, PageLoading };
