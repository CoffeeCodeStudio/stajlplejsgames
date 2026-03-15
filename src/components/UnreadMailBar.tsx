import { Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface UnreadMailBarProps {
  unreadCount: number;
  onTabChange?: (tab: string) => void;
}

export function UnreadMailBar({ unreadCount, onTabChange }: UnreadMailBarProps) {
  const { user } = useAuth();

  // Only show for logged in users with unread mail
  if (!user || unreadCount === 0) return null;

  return (
    <button
      onClick={() => onTabChange?.("mejl")}
      className={cn(
        "w-full bg-primary/10 border-b border-primary/20",
        "px-4 py-1.5 flex items-center justify-center gap-2",
        "text-xs text-primary hover:bg-primary/20 transition-colors",
        "cursor-pointer"
      )}
    >
      <Mail className="w-3.5 h-3.5" />
      <span>Du har <strong>{unreadCount}</strong> olästa mejl</span>
    </button>
  );
}
