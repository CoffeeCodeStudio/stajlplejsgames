/**
 * @module MsnAvatarPicker
 * Classic MSN "Change Display Picture" dialog with grid + preview panel.
 * Uses real cartoon-style avatar images instead of emoji placeholders.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "../ui/button";

// Import avatar images
import msnDuckImg from "@/assets/avatars/msn-duck.png";
import msnCatImg from "@/assets/avatars/msn-cat.png";
import msnDogImg from "@/assets/avatars/msn-dog.png";
import msnFrogImg from "@/assets/avatars/msn-frog.png";
import msnOwlImg from "@/assets/avatars/msn-owl.png";
import msnPandaImg from "@/assets/avatars/msn-panda.png";
import msnPenguinImg from "@/assets/avatars/msn-penguin.png";
import msnMonkeyImg from "@/assets/avatars/msn-monkey.png";
import msnBearImg from "@/assets/avatars/msn-bear.png";
import msnRabbitImg from "@/assets/avatars/msn-rabbit.png";
import msnFoxImg from "@/assets/avatars/msn-fox.png";
import msnLionImg from "@/assets/avatars/msn-lion.png";
import msnGuitarImg from "@/assets/avatars/msn-guitar.png";
import msnSoccerImg from "@/assets/avatars/msn-soccer.png";
import msnHeartImg from "@/assets/avatars/msn-heart.png";
import msnStarImg from "@/assets/avatars/msn-star.png";
import msnFlowerImg from "@/assets/avatars/msn-flower.png";
import msnUnicornImg from "@/assets/avatars/msn-unicorn.png";
import msnGhostImg from "@/assets/avatars/msn-ghost.png";
import msnRobotImg from "@/assets/avatars/msn-robot2.png";

const msnAvatarPresets = [
  { id: "msn-duck", label: "Anka", src: msnDuckImg },
  { id: "msn-cat", label: "Katt", src: msnCatImg },
  { id: "msn-dog", label: "Hund", src: msnDogImg },
  { id: "msn-frog", label: "Groda", src: msnFrogImg },
  { id: "msn-owl", label: "Uggla", src: msnOwlImg },
  { id: "msn-panda", label: "Panda", src: msnPandaImg },
  { id: "msn-penguin", label: "Pingvin", src: msnPenguinImg },
  { id: "msn-monkey", label: "Apa", src: msnMonkeyImg },
  { id: "msn-bear", label: "Björn", src: msnBearImg },
  { id: "msn-rabbit", label: "Kanin", src: msnRabbitImg },
  { id: "msn-fox", label: "Räv", src: msnFoxImg },
  { id: "msn-lion", label: "Lejon", src: msnLionImg },
  { id: "msn-guitar", label: "Gitarr", src: msnGuitarImg },
  { id: "msn-soccer", label: "Fotboll", src: msnSoccerImg },
  { id: "msn-heart", label: "Hjärta", src: msnHeartImg },
  { id: "msn-star", label: "Stjärna", src: msnStarImg },
  { id: "msn-flower", label: "Blomma", src: msnFlowerImg },
  { id: "msn-unicorn", label: "Enhörning", src: msnUnicornImg },
  { id: "msn-ghost", label: "Spöke", src: msnGhostImg },
  { id: "msn-robot", label: "Robot", src: msnRobotImg },
];

interface MsnAvatarPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (avatarId: string, avatarSrc: string) => void;
  currentAvatarId?: string;
}

export function MsnAvatarPicker({ open, onClose, onSelect, currentAvatarId }: MsnAvatarPickerProps) {
  const [selected, setSelected] = useState(currentAvatarId || msnAvatarPresets[0].id);

  if (!open) return null;

  const selectedPreset = msnAvatarPresets.find(a => a.id === selected) || msnAvatarPresets[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#ece9d8] dark:bg-gray-800 rounded-sm shadow-2xl border border-gray-400 dark:border-gray-600 w-[420px] max-w-[95vw] max-h-[90vh] flex flex-col">
        {/* XP-style title bar */}
        <div className="bg-gradient-to-r from-[#0a246a] via-[#3a6ea5] to-[#0a246a] px-3 py-1.5 flex items-center justify-between rounded-t-sm">
          <span className="text-white text-[12px] font-bold">Byt visningsbild</span>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 flex-1 overflow-hidden">
          <p className="text-[11px] text-gray-700 dark:text-gray-300 mb-3">
            Välj en bild att visa för dina kontakter:
          </p>

          <div className="flex gap-3">
            {/* Avatar Grid */}
            <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded-sm p-2 overflow-y-auto max-h-[280px]">
              <div className="grid grid-cols-5 gap-1.5">
                {msnAvatarPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelected(preset.id)}
                    className={cn(
                      "w-12 h-12 rounded-sm overflow-hidden border-2 transition-all hover:scale-105",
                      selected === preset.id
                        ? "border-[#316ac5] ring-1 ring-[#316ac5] shadow-md"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
                    )}
                    title={preset.label}
                  >
                    <img
                      src={preset.src}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Panel */}
            <div className="w-28 flex flex-col items-center gap-2">
              <div className="w-24 h-24 bg-white dark:bg-gray-900 border-2 border-gray-400 dark:border-gray-600 rounded-sm overflow-hidden">
                <img
                  src={selectedPreset.src}
                  alt={selectedPreset.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-400 text-center font-medium">
                {selectedPreset.label}
              </span>
            </div>
          </div>
        </div>

        {/* XP-style button bar */}
        <div className="px-3 py-2 bg-[#ece9d8] dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 flex justify-end gap-2 rounded-b-sm">
          <Button
            onClick={() => {
              onSelect(selectedPreset.id, selectedPreset.src);
              onClose();
            }}
            className="bg-gradient-to-b from-[#f5f5f5] to-[#dcdcdc] hover:from-[#e8e8e8] hover:to-[#d0d0d0] text-gray-900 text-[11px] border border-gray-400 px-4 h-7 shadow-sm"
          >
            OK
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-gradient-to-b from-[#f5f5f5] to-[#dcdcdc] hover:from-[#e8e8e8] hover:to-[#d0d0d0] text-gray-900 text-[11px] border border-gray-400 px-4 h-7 shadow-sm"
          >
            Avbryt
          </Button>
        </div>
      </div>
    </div>
  );
}
