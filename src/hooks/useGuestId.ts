import { useMemo } from 'react';

/**
 * Returns a stable guest ID for anonymous users.
 * Persisted in localStorage so it survives page reloads.
 */
export function useGuestId(): string {
  return useMemo(() => {
    const KEY = 'scribble_guest_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  }, []);
}
