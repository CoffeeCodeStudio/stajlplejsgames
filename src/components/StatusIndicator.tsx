import { cn } from "@/lib/utils";

export type UserStatus = "online" | "away" | "busy" | "offline";

interface StatusIndicatorProps {
  status: UserStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: 14,
  md: 17,
  lg: 22,
};

const statusColors: Record<UserStatus, string> = {
  online: "hsl(var(--online-green))",
  away: "hsl(var(--away-orange))",
  busy: "hsl(var(--busy-red))",
  offline: "hsl(var(--offline-gray))",
};

const statusAnimClass: Record<UserStatus, string> = {
  online: "animate-star-online",
  away: "animate-star-away",
  busy: "animate-star-busy",
  offline: "",
};

const statusGlow: Record<UserStatus, string> = {
  online: "drop-shadow(0 0 3px hsl(var(--online-green) / 0.8)) drop-shadow(0 0 6px hsl(var(--online-green) / 0.4))",
  away: "drop-shadow(0 0 3px hsl(var(--away-orange) / 0.6)) drop-shadow(0 0 5px hsl(var(--away-orange) / 0.3))",
  busy: "drop-shadow(0 0 3px hsl(var(--busy-red) / 0.6))",
  offline: "none",
};

/**
 * 8-bit pixel star status indicator with retro animations and glow.
 */
export function StatusIndicator({ status, size = "md", className }: StatusIndicatorProps) {
  const px = sizeMap[size];
  const color = statusColors[status];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 16 16"
      className={cn(statusAnimClass[status], className)}
      style={{ filter: statusGlow[status], imageRendering: "pixelated" }}
      aria-label={`Status: ${status}`}
    >
      <polygon
        points="8,0 10,5.5 16,5.5 11,9 13,15 8,11.5 3,15 5,9 0,5.5 6,5.5"
        fill={color}
      />
    </svg>
  );
}
