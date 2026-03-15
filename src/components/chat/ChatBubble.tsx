import { cn } from "@/lib/utils";
import { Avatar } from "../Avatar";
import type { UserStatus } from "../StatusIndicator";

interface ChatBubbleProps {
  message: string;
  timestamp: string;
  isSelf?: boolean;
  senderName?: string;
  senderAvatar?: string;
  senderStatus?: UserStatus;
  showAvatar?: boolean;
}

export function ChatBubble({
  message,
  timestamp,
  isSelf = false,
  senderName,
  senderAvatar,
  senderStatus = "online",
  showAvatar = true,
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-2 animate-fade-in",
        isSelf ? "flex-row-reverse" : "flex-row"
      )}
    >
      {showAvatar && !isSelf && senderName && (
        <Avatar
          src={senderAvatar}
          name={senderName}
          status={senderStatus}
          size="sm"
          showStatus={false}
        />
      )}
      <div
        className={cn(
          "flex flex-col gap-1",
          isSelf ? "items-end" : "items-start"
        )}
      >
        {!isSelf && senderName && (
          <span className="text-xs text-muted-foreground px-1">
            {senderName}
          </span>
        )}
        <div
          className={cn(
            "chat-bubble",
            isSelf ? "chat-bubble-self" : "chat-bubble-other"
          )}
        >
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {timestamp}
        </span>
      </div>
    </div>
  );
}
