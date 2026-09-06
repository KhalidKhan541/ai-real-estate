import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  autoResize?: boolean;
  maxRows?: number;
  minRows?: number;
  showCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      containerClassName,
      autoResize = false,
      maxRows = 10,
      minRows = 3,
      showCount = false,
      maxLength,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [localValue, setLocalValue] = React.useState<string>(
      (value as string) ?? ""
    );
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    React.useImperativeHandle(
      ref,
      () => textareaRef.current as HTMLTextAreaElement
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value as string);
      }
    }, [value]);

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      textarea.style.height = "auto";
      const lineHeight = parseInt(
        window.getComputedStyle(textarea).lineHeight || "20",
        10
      );
      const minH = minRows * lineHeight;
      const maxH = maxRows * lineHeight;
      const scrollH = textarea.scrollHeight;

      textarea.style.height = `${Math.min(Math.max(scrollH, minH), maxH)}px`;
      textarea.style.overflowY = scrollH > maxH ? "auto" : "hidden";
    }, [autoResize, minRows, maxRows]);

    React.useEffect(() => {
      adjustHeight();
    }, [localValue, adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (maxLength && newValue.length > maxLength) return;
      setLocalValue(newValue);
      onChange?.(e);
    };

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && (
              <span className="ml-0.5 text-red-500">*</span>
            )}
          </label>
        )}
        <textarea
          id={inputId}
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          rows={minRows}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          className={cn(
            "flex w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-gray-300 dark:border-gray-600 focus-visible:ring-primary-500",
            autoResize && "resize-none overflow-hidden",
            !autoResize && "resize-y",
            className
          )}
          {...props}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {error && (
              <p id={errorId} className="text-xs text-red-500" role="alert">
                {error}
              </p>
            )}
            {hint && !error && (
              <p id={hintId} className="text-xs text-gray-500">
                {hint}
              </p>
            )}
          </div>
          {showCount && (
            <span
              className={cn(
                "text-xs tabular-nums",
                maxLength && localValue.length >= maxLength
                  ? "text-red-500"
                  : "text-gray-400"
              )}
            >
              {localValue.length}
              {maxLength ? `/${maxLength}` : ""}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
