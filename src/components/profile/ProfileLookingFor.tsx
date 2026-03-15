/**
 * @module ProfileLookingFor
 * "Letar efter" tag selector / display.
 */
import { cn } from "@/lib/utils";
import { lookingForOptions, type EditableProfileData } from "./profile-constants";

interface ProfileLookingForProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
}

export function ProfileLookingFor({ displayData, editData, setEditData, isEditing }: ProfileLookingForProps) {
  const toggle = (option: string) => {
    setEditData((prev) => ({
      ...prev,
      looking_for: prev.looking_for.includes(option)
        ? prev.looking_for.filter((o) => o !== option)
        : [...prev.looking_for, option],
    }));
  };

  return (
    <div className="mt-4">
      <span className="text-sm text-muted-foreground">Letar efter:</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {isEditing ? (
          lookingForOptions.map((option) => (
            <button
              key={option}
              onClick={() => toggle(option)}
              className={cn(
                "px-2 py-0.5 text-xs rounded border transition-all",
                editData.looking_for.includes(option)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {option}
            </button>
          ))
        ) : displayData.looking_for.length > 0 ? (
          displayData.looking_for.map((item) => (
            <span key={item} className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary border border-primary/20">
              {item}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Ej angivet</span>
        )}
      </div>
    </div>
  );
}
