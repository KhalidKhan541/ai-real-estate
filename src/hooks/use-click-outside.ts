import * as React from "react";

function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  options?: {
    enabled?: boolean;
    ignoreClass?: string;
  }
): React.RefObject<T> {
  const ref = React.useRef<T>(null);
  const { enabled = true, ignoreClass } = options ?? {};

  React.useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!ref.current || ref.current.contains(target)) return;

      if (ignoreClass) {
        const targetEl = target as HTMLElement;
        if (targetEl.closest?.(`.${ignoreClass}`)) return;
      }

      handler();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler, enabled, ignoreClass]);

  return ref;
}

export { useClickOutside };
