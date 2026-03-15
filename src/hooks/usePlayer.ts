import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Reads the player username from the `?usr=` URL parameter.
 * Returns null if no username is provided.
 */
export function usePlayer() {
  const [searchParams] = useSearchParams();

  const username = useMemo(() => {
    const raw = searchParams.get("usr");
    if (!raw) return null;
    // Sanitize: trim, limit to 30 chars, remove special chars
    return raw.trim().slice(0, 30).replace(/[^a-zA-Z0-9_åäöÅÄÖ -]/g, "") || null;
  }, [searchParams]);

  return { username };
}
