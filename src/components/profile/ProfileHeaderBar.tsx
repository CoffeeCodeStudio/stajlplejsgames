import { Edit2, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { EditableProfileData } from "./profile-constants";

interface ProfileHeaderBarProps {
  displayData: EditableProfileData;
  isOwnProfile: boolean;
  isEditing: boolean;
  saving: boolean;
  showDemoMode: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * The gradient header bar showing username, gender, age, and city plus
 * edit/save/cancel controls for the profile owner.
 */
export function ProfileHeaderBar({
  displayData,
  isOwnProfile,
  isEditing,
  saving,
  showDemoMode,
  onEdit,
  onSave,
  onCancel,
}: ProfileHeaderBarProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground">
      <div className="container px-4 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-display font-bold text-base sm:text-lg uppercase truncate">
              {displayData.username}
            </span>
            <span className="text-xs sm:text-sm whitespace-nowrap">
              {displayData.gender && `- ${displayData.gender}`}
              {displayData.age && `, ${displayData.age} ÅR`}
              {displayData.city && `, ${displayData.city.toUpperCase()}`}
            </span>
          </div>
          {isOwnProfile && !showDemoMode && (
            <div className="shrink-0">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={onSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Spara
                  </Button>
                  <Button size="sm" variant="outline" className="text-foreground" onClick={onCancel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" onClick={onEdit}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Redigera
                </Button>
              )}
            </div>
          )}
          {showDemoMode && (
            <Button size="sm" variant="secondary" onClick={() => navigate("/auth")} className="shrink-0">
              Logga in för att skapa profil
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
