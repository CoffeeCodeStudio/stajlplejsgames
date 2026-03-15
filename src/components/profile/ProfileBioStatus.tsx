/**
 * @module ProfileBioStatus
 * Bio ("Om mig"), status message, and member-since footer sections.
 */
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EditableProfileData } from "./profile-constants";

interface ProfileBioStatusProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
  memberSince: string;
}

export function ProfileBioStatus({ displayData, editData, setEditData, isEditing, memberSince }: ProfileBioStatusProps) {
  return (
    <>
      {/* Bio */}
      <div className="border-t border-border p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Om mig</h3>
        {isEditing ? (
          <Textarea
            value={editData.bio}
            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
            rows={3} className="text-sm" placeholder="Berätta lite om dig själv..."
          />
        ) : (
          <p className="text-sm text-foreground/80">{displayData.bio || "Ingen beskrivning ännu..."}</p>
        )}
      </div>

      {/* Status Message */}
      <div className="border-t border-border p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Statusmeddelande</h3>
        {isEditing ? (
          <Input
            value={editData.status_message}
            onChange={(e) => setEditData({ ...editData, status_message: e.target.value })}
            className="text-sm" placeholder="Vad gör du just nu?"
          />
        ) : (
          <p className="text-sm text-foreground/80 italic">
            {displayData.status_message ? `"${displayData.status_message}"` : "Inget statusmeddelande"}
          </p>
        )}
      </div>

      {/* Member Since */}
      <div className="border-t border-border px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Medlem sedan {memberSince}</span>
        </div>
      </div>
    </>
  );
}
