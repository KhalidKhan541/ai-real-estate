import { useState, useCallback, useRef } from "react";

export interface UseCopyToClipboardResult {
  copiedText: string | null;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export function useCopyToClipboard(): UseCopyToClipboardResult {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);

      timeoutRef.current = setTimeout(() => {
        setCopiedText(null);
      }, 2000);

      return true;
    } catch (error) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          setCopiedText(text);
          timeoutRef.current = setTimeout(() => {
            setCopiedText(null);
          }, 2000);
          return true;
        }

        return false;
      } catch {
        console.error("Failed to copy text");
        return false;
      }
    }
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCopiedText(null);
  }, []);

  return {
    copiedText,
    copy,
    reset,
  };
}

export function useCopyRichText(): {
  copied: boolean;
  copyRichText: (html: string, plainText: string) => Promise<boolean>;
  reset: () => void;
} {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyRichText = useCallback(
    async (html: string, plainText: string): Promise<boolean> => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      try {
        const blob = new Blob([html], { type: "text/html" });
        const textBlob = new Blob([plainText], { type: "text/plain" });

        const data = new ClipboardItem({
          "text/html": blob,
          "text/plain": textBlob,
        });

        await navigator.clipboard.write([data]);
        setCopied(true);

        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, 2000);

        return true;
      } catch {
        const fallbackCopied = await navigator.clipboard.writeText(plainText);
        setCopied(true);

        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, 2000);

        return true;
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCopied(false);
  }, []);

  return {
    copied,
    copyRichText,
    reset,
  };
}

export function useCopyImage(): {
  copied: boolean;
  copyImage: (url: string) => Promise<boolean>;
  reset: () => void;
} {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyImage = useCallback(async (url: string): Promise<boolean> => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      setCopied(true);

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return true;
    } catch {
      console.error("Failed to copy image");
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCopied(false);
  }, []);

  return {
    copied,
    copyImage,
    reset,
  };
}

export default useCopyToClipboard;
