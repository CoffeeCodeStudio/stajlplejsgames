import { Video, Monitor } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";

interface VideoCallMenuProps {
  onSelectCamera: () => void;
  onSelectScreen: () => void;
  children: React.ReactNode;
}

export function VideoCallMenu({ onSelectCamera, onSelectScreen, children }: VideoCallMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-52 p-2 bg-gradient-to-b from-[#2d5aa0] to-[#1e4c8a] border-white/20" side="bottom" align="start">
        <div className="flex flex-col gap-1">
          <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-wider px-2 py-1">Välj videokälla</h4>
          <Button
            variant="ghost"
            className="justify-start text-white hover:bg-white/20 text-sm gap-2"
            onClick={onSelectCamera}
          >
            <Video className="w-4 h-4" />
            Webbkamera
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-white hover:bg-white/20 text-sm gap-2"
            onClick={onSelectScreen}
          >
            <Monitor className="w-4 h-4" />
            Skärmdelning
          </Button>
          <p className="text-[9px] text-white/40 px-2 mt-1">
            Skärmdelning stödjer Full HD (1080p) och systemljud
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
