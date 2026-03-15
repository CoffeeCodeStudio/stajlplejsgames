/** Per-conversation header showing contact info + action buttons */
import { ArrowLeft, Phone, Video, Bell, MoreVertical } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar } from "../Avatar";
import { StatusIndicator } from "../StatusIndicator";
import { VideoCallMenu } from "../calls/VideoCallMenu";
import type { MsnContact } from "./MsnContactList";

interface ChatContactHeaderProps {
  contact: MsnContact;
  isMobile: boolean;
  onBack: () => void;
  onNudge: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onScreenShare: () => void;
}

export function ChatContactHeader({
  contact, isMobile, onBack, onNudge, onVoiceCall, onVideoCall, onScreenShare,
}: ChatContactHeaderProps) {
  return (
    <div id="msn-chat-window" className="bg-gradient-to-r from-[hsl(220,80%,50%)] to-[hsl(200,80%,60%)] text-white">
      <div className="flex items-center justify-between px-2 py-2 bg-gradient-to-b from-white/20 to-transparent gap-2">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 flex-shrink-0" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar name={contact.name} size="sm" />
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusIndicator status={contact.status} size="sm" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm truncate">{contact.name}</h2>
            <p className="text-[11px] text-white/80 truncate">{contact.statusMessage || contact.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20 hidden sm:flex" onClick={onVoiceCall}>
            <Phone className="w-4 h-4" />
          </Button>
          <VideoCallMenu onSelectCamera={onVideoCall} onSelectScreen={onScreenShare}>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20 hidden sm:flex">
              <Video className="w-4 h-4" />
            </Button>
          </VideoCallMenu>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" onClick={onNudge}>
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
