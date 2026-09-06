import { useEffect, useRef, RefObject } from "react";

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  options?: {
    enabled?: boolean;
    ignore?: string[];
  }
): RefObject<T> {
  const ref = useRef<T>(null);
  const enabled = options?.enabled ?? true;
  const ignore = options?.ignore ?? [];

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      for (const selector of ignore) {
        const ignoredElement = document.querySelector(selector);
        if (ignoredElement && ignoredElement.contains(target)) {
          return;
        }
      }

      handler();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [handler, enabled, ignore]);

  return ref;
}

export function useClickOutsideAll(
  handlers: Array<{ ref: RefObject<HTMLElement>; handler: () => void }>,
  options?: {
    enabled?: boolean;
  }
): void {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      for (const { ref, handler } of handlers) {
        if (ref.current && !ref.current.contains(target)) {
          handler();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [handlers, enabled]);
}

export function useClickOutsideIfNotContained(
  handler: () => void,
  containerRef: RefObject<HTMLElement>,
  options?: {
    enabled?: boolean;
  }
): void {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (containerRef.current && !containerRef.current.contains(target)) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [handler, containerRef, enabled]);
}

export default useClickOutside;
