import { cn } from "@/lib/utils";
import { StatusIndicator, type UserStatus } from "./StatusIndicator";

interface AvatarProps {
  src?: string;
  name: string;
  status?: UserStatus;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const statusPositions = {
  sm: "-bottom-0.5 -right-0.5",
  md: "-bottom-0.5 -right-0.5",
  lg: "bottom-0 right-0",
  xl: "bottom-0.5 right-0.5",
};

export function Avatar({ 
  src, 
  name, 
  status, 
  size = "md", 
  showStatus = true,
  className 
}: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center font-semibold text-foreground overflow-hidden ring-2 ring-border",
          sizeClasses[size],
          status === "online" && showStatus && "ring-online/50"
        )}
      >
        {src ? (
          <img 
            src={src} 
            alt={name} 
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="select-none">{initials}</span>
        )}
      </div>
      {showStatus && status && (
        <StatusIndicator
          status={status}
          size={size === "xl" ? "lg" : size === "lg" ? "md" : "sm"}
          className={cn("absolute", statusPositions[size])}
        />
      )}
    </div>
  );
}
