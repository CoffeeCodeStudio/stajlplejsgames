import { Gamepad2, Palette, Heart, Bot, Lightbulb } from "lucide-react";
import { BentoCard } from "./BentoCard";

function VisionItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span>{text}</span>
    </div>
  );
}

export function HomeVisionBox() {
  return (
    <BentoCard title="Vår Vision" icon={<Lightbulb className="w-4 h-4" />}>
      <div className="space-y-2.5">
        <VisionItem icon={<Gamepad2 className="w-4 h-4 text-primary" />} text="Spel & Tävlingar" />
        <VisionItem icon={<Palette className="w-4 h-4 text-accent" />} text="Konst & Kreativitet" />
        <VisionItem icon={<Heart className="w-4 h-4 text-destructive" />} text="Gemenskap & Vänskap" />
        <div className="flex items-start gap-2 pt-2 mt-1 border-t border-[hsl(var(--glass-border))]">
          <div className="flex-shrink-0">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <div className="relative bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs text-muted-foreground break-words">
            <div className="absolute -left-1.5 top-2 w-0 h-0 border-t-[5px] border-t-transparent border-r-[6px] border-r-border border-b-[5px] border-b-transparent" />
            Vad väntar du på? Inget MSN-virus här inte!
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
