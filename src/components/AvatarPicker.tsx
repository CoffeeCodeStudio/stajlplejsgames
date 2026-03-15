import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// Import all avatars
import avatarBoyBlue from "@/assets/avatars/avatar-boy-blue.png";
import avatarGirlPink from "@/assets/avatars/avatar-girl-pink.png";
import avatarBoyGreen from "@/assets/avatars/avatar-boy-green.png";
import avatarGirlPurple from "@/assets/avatars/avatar-girl-purple.png";
import avatarBoyOrange from "@/assets/avatars/avatar-boy-orange.png";
import avatarGirlBlonde from "@/assets/avatars/avatar-girl-blonde.png";
import avatarCat from "@/assets/avatars/avatar-cat.png";
import avatarRobot from "@/assets/avatars/avatar-robot.png";

export interface AvatarOption {
  id: string;
  name: string;
  src: string;
  category: "killar" | "tjejer" | "övrigt";
}

export const avatarOptions: AvatarOption[] = [
  { id: "boy-blue", name: "Blåhårig kille", src: avatarBoyBlue, category: "killar" },
  { id: "boy-green", name: "Grön mohawk", src: avatarBoyGreen, category: "killar" },
  { id: "boy-orange", name: "Fräknar", src: avatarBoyOrange, category: "killar" },
  { id: "girl-pink", name: "Rosa tofsar", src: avatarGirlPink, category: "tjejer" },
  { id: "girl-purple", name: "Lila hörlurar", src: avatarGirlPurple, category: "tjejer" },
  { id: "girl-blonde", name: "Stjärnflicka", src: avatarGirlBlonde, category: "tjejer" },
  { id: "cat", name: "Cool katt", src: avatarCat, category: "övrigt" },
  { id: "robot", name: "Robot", src: avatarRobot, category: "övrigt" },
];

interface AvatarPickerProps {
  selectedAvatarId?: string;
  onSelect?: (avatar: AvatarOption) => void;
  className?: string;
}

export function AvatarPicker({ selectedAvatarId, onSelect, className }: AvatarPickerProps) {
  const [activeCategory, setActiveCategory] = useState<"alla" | "killar" | "tjejer" | "övrigt">("alla");

  const categories = ["alla", "killar", "tjejer", "övrigt"] as const;

  const filteredAvatars = activeCategory === "alla" 
    ? avatarOptions 
    : avatarOptions.filter(a => a.category === activeCategory);

  return (
    <div className={cn("bg-card rounded-xl border border-border p-4 w-full max-w-lg mx-auto", className)}>
      <h3 className="font-display font-bold text-lg mb-3 text-primary">Välj avatar</h3>
      
      {/* Category tabs */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1 mb-4 bg-muted rounded-lg p-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-1 min-w-[60px] px-2 py-1.5 text-[11px] sm:text-xs font-bold uppercase rounded-md transition-all whitespace-nowrap",
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Avatar grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 px-1">
        {filteredAvatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => onSelect?.(avatar)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-200 hover:scale-105 bg-muted/50",
              selectedAvatarId === avatar.id
                ? "border-primary ring-2 ring-primary/30 bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-background border border-border/50">
              <img
                src={avatar.src}
                alt={avatar.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate w-full text-center">
              {avatar.name}
            </span>
            {selectedAvatarId === avatar.id && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected info */}
      {selectedAvatarId && (
        <div className="mt-3 text-center text-sm text-muted-foreground">
          Vald: <span className="text-primary font-bold">
            {avatarOptions.find(a => a.id === selectedAvatarId)?.name}
          </span>
        </div>
      )}
    </div>
  );
}

// Export a hook for managing avatar state
export function useAvatar() {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption>(avatarOptions[0]);

  return {
    selectedAvatar,
    setSelectedAvatar,
    avatarSrc: selectedAvatar.src,
    avatarName: selectedAvatar.name,
  };
}
