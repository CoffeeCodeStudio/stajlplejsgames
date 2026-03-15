import { Radio } from "lucide-react";
import { BentoCard } from "./BentoCard";

export function HomeLajvBox() {
  return (
    <BentoCard title="Lajv Just Nu!" icon={<Radio className="w-4 h-4 animate-pulse" />}>
      <div className="flex flex-col items-center justify-center text-center min-h-[60px]">
        <Radio className="w-7 h-7 text-muted-foreground/20 mb-2" />
        <p className="text-sm text-muted-foreground">Kommer snart</p>
      </div>
    </BentoCard>
  );
}
