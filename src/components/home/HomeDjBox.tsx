import { Music } from "lucide-react";
import { BentoCard } from "./BentoCard";

export function HomeDjBox() {
  return (
    <BentoCard title="Dagens DJ" icon={<Music className="w-4 h-4" />}>
      <div className="flex flex-col items-center justify-center text-center min-h-[60px]">
        <Music className="w-7 h-7 text-muted-foreground/20 mb-2" />
        <p className="text-sm text-muted-foreground">Kommer snart</p>
      </div>
    </BentoCard>
  );
}
