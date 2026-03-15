/**
 * Shared date/time formatting utilities for the Echo2000 app.
 * Used across components to avoid duplicated formatting logic.
 */

/** Format seconds as "M:SS" (e.g. 125 → "2:05"). For game timers, audio players etc. */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Format a date string as short Swedish date, e.g. "14 feb." */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });
}

/** Format a date string as full Swedish date, e.g. "14 februari 2025" */
export function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Format a date string as relative Swedish time, e.g. "Idag kl: 14:30" or "12 feb kl: 09:15" */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

  if (isToday) return `Idag kl: ${timeStr}`;
  return (
    date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) +
    ` kl: ${timeStr}`
  );
}

/** Format a timestamp as relative Swedish (e.g. "Just nu", "5 min sedan", "Igår") */
export function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just nu";
  if (diffMins < 60) return `${diffMins} min sedan`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h sedan`;

  const isYesterday =
    new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
  if (isYesterday) return "Igår";

  return date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}
