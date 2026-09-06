import * as React from "react";

interface UseCopyToClipboardResult {
  copiedText: string | null;
  isCopied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

function useCopyToClipboard(
  timeout: number = 2000
): UseCopyToClipboardResult {
  const [copiedText, setCopiedText] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = React.useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        console.warn("Clipboard API not available");
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        setIsCopied(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setIsCopied(false);
          setCopiedText(null);
        }, timeout);

        return true;
      } catch (error) {
        // Fallback for older browsers
        try {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          textarea.style.top = "-9999px";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          const success = document.execCommand("copy");
          document.body.removeChild(textarea);

          if (success) {
            setCopiedText(text);
            setIsCopied(true);
            timeoutRef.current = setTimeout(() => {
              setIsCopied(false);
              setCopiedText(null);
            }, timeout);
            return true;
          }
          return false;
        } catch {
          console.error("Failed to copy text");
          return false;
        }
      }
    },
    [timeout]
  );

  const reset = React.useCallback(() => {
    setCopiedText(null);
    setIsCopied(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { copiedText, isCopied, copy, reset };
}

export { useCopyToClipboard };
