import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(initialValue = false) {
  const [isMobile, setIsMobile] = React.useState<boolean>(initialValue);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // During SSR and initial render, use the server-provided guess so we don't
  // flash the desktop shell on mobile before hydration completes.
  if (!isHydrated) {
    return initialValue;
  }

  return isMobile;
}
