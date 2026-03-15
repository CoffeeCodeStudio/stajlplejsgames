import { useState, useEffect, useRef } from "react";

export function useScrollDirection(threshold = 10) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDir = (currentY: number) => {
      const diff = currentY - lastScrollY.current;

      if (Math.abs(diff) < threshold) {
        ticking.current = false;
        return;
      }

      // Always show at top of container
      if (currentY < 50) {
        setIsVisible(true);
      } else if (diff > 0) {
        setIsVisible(false); // scrolling down → hide
      } else {
        setIsVisible(true);  // scrolling up → show
      }

      lastScrollY.current = currentY > 0 ? currentY : 0;
      ticking.current = false;
    };

    // Listen on window AND capture scroll events from any inner element
    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollY = target.scrollTop ?? window.scrollY;

      if (!ticking.current) {
        window.requestAnimationFrame(() => updateScrollDir(scrollY));
        ticking.current = true;
      }
    };

    // Use capture:true so we intercept scroll from any child container
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return isVisible;
}
