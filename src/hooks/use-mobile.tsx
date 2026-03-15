import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Detects whether the viewport is narrower than {@link MOBILE_BREAKPOINT} (768 px).
 *
 * Listens to the `matchMedia` change event so the value updates on resize.
 *
 * @returns `true` when the viewport width is below 768 px.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
