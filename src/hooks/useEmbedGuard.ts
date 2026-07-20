// Embed guard disabled — app is always shown regardless of iframe/referrer.
// Security for this is handled elsewhere; see project history if this
// needs to be reinstated.
export function useEmbedGuard() {
  return { isEmbedded: true };
}
