import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1025px)");
}

export function useIsDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

export function useIsReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function useBreakpoint(): "xs" | "sm" | "md" | "lg" | "xl" | "2xl" {
  const isXs = useMediaQuery("(max-width: 640px)");
  const isSm = useMediaQuery("(min-width: 641px) and (max-width: 768px)");
  const isMd = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
  const isLg = useMediaQuery("(min-width: 1025px) and (max-width: 1280px)");
  const isXl = useMediaQuery("(min-width: 1281px) and (max-width: 1536px)");
  const is2xl = useMediaQuery("(min-width: 1537px)");

  if (isXs) return "xs";
  if (isSm) return "sm";
  if (isMd) return "md";
  if (isLg) return "lg";
  if (isXl) return "xl";
  return "2xl";
}

export default useMediaQuery;
