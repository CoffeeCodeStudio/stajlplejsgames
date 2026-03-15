import { Phone, PhoneOff, Video, Monitor } from "lucide-react";
import { Avatar } from "../Avatar";
import { Button } from "../ui/button";
import type { CallType } from "@/hooks/useWebRTC";

interface IncomingCallDialogProps {
  callerName: string;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallDialog({ callerName, callType, onAccept, onDecline }: IncomingCallDialogProps) {
  const typeLabel = callType === "voice" ? "Röstsamtal" : callType === "video" ? "Videosamtal" : "Skärmdelning";
  const TypeIcon = callType === "voice" ? Phone : callType === "video" ? Video : Monitor;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-b from-[#1e4c8a] to-[#0a1628] rounded-xl p-6 shadow-2xl border border-white/10 max-w-xs w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          {/* Pulsing avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
              <Avatar name={callerName} size="lg" />
            </div>
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1.5 animate-bounce">
              <TypeIcon className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-white font-bold text-lg">{callerName}</h3>
            <p className="text-white/60 text-sm">{typeLabel} inkommande...</p>
          </div>

          <div className="flex gap-4 mt-2">
            <Button
              onClick={onDecline}
              className="rounded-full bg-red-600 hover:bg-red-500 text-white px-6"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Avvisa
            </Button>
            <Button
              onClick={onAccept}
              className="rounded-full bg-green-600 hover:bg-green-500 text-white px-6"
            >
              <Phone className="w-4 h-4 mr-2" />
              Svara
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
