/** Desktop toolbar with call/invite/game/nudge actions */
import { Users, Mic, Video, Gamepad2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoCallMenu } from "../calls/VideoCallMenu";

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function ToolbarButton({ icon, label, onClick, isActive = false }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-white/10 transition-colors",
        isActive && "bg-white/20"
      )}
    >
      {icon}
      <span className="text-[9px] text-white/80">{label}</span>
    </button>
  );
}

interface ChatToolbarProps {
  onInvite: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onScreenShare: () => void;
  onNudge: () => void;
  showInviteDialog: boolean;
  callActive: boolean;
  callType: string;
}

export function ChatToolbar({
  onInvite, onVoiceCall, onVideoCall, onScreenShare, onNudge,
  showInviteDialog, callActive, callType,
}: ChatToolbarProps) {
  return (
    <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-gradient-to-b from-transparent to-black/10">
      <ToolbarButton
        icon={<Users className="w-4 h-4" />}
        label="Bjud in"
        onClick={onInvite}
        isActive={showInviteDialog}
      />
      <ToolbarButton
        icon={<Mic className="w-4 h-4" />}
        label="Röst"
        onClick={onVoiceCall}
        isActive={callActive && callType === "voice"}
      />
      <VideoCallMenu onSelectCamera={onVideoCall} onSelectScreen={onScreenShare}>
        <div>
          <ToolbarButton
            icon={<Video className="w-4 h-4" />}
            label="Video"
            isActive={callActive && (callType === "video" || callType === "screenshare")}
          />
        </div>
      </VideoCallMenu>
      <ToolbarButton icon={<Gamepad2 className="w-4 h-4" />} label="Spel" />
      <div className="h-4 w-px bg-white/30 mx-1" />
      <ToolbarButton icon={<Bell className="w-4 h-4" />} label="Nudge" onClick={onNudge} />
    </div>
  );
}
