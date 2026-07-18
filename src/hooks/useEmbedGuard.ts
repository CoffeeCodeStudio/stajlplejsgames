import { useMemo } from "react";

const ALLOWED_PARENT_DOMAIN = "stajlplejs.com";

function isAllowedReferrer(referrer: string): boolean {
  if (!referrer) return false;
  try {
    const host = new URL(referrer).hostname;
    return host === ALLOWED_PARENT_DOMAIN || host.endsWith(`.${ALLOWED_PARENT_DOMAIN}`);
  } catch {
    return false;
  }
}

/**
 * Verifies the app is actually embedded as an iframe inside a StajlPlejs page,
 * rather than opened directly via the raw Vercel URL.
 */
export function useEmbedGuard() {
  const isEmbedded = useMemo(() => {
    if (import.meta.env.DEV) return true;

    const inIframe = window.self !== window.top;
    if (!inIframe) return false;
    return isAllowedReferrer(document.referrer);
  }, []);

  return { isEmbedded };
}
