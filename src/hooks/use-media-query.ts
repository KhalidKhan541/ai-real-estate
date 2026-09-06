import * as React from "react";

function useMediaQuery(query: string): boolean {
  const getMatches = React.useCallback((q: string): boolean => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(q).matches;
  }, []);

  const [matches, setMatches] = React.useState<boolean>(() => getMatches(query));

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = () => setMatches(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    setMatches(mediaQuery.matches);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query, getMatches]);

  return matches;
}

export { useMediaQuery };
