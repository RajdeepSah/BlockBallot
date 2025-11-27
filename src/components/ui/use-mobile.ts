import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile-sized.
 * Uses window.matchMedia for responsive detection.
 * 
 * @returns Boolean indicating if viewport is mobile (width < 768px)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setIsMobile(false);
      return;
    }

    try {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };
      mql.addEventListener("change", onChange);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      return () => mql.removeEventListener("change", onChange);
    } catch (error) {
      console.error('Error setting up mobile detection:', error);
      setIsMobile(false);
    }
  }, []);

  return !!isMobile;
}
