/**
 * @module ProfileAvatar
 * Avatar display and edit controls for the profile page.
 */
import { Edit2 } from "lucide-react";
import { AvatarPicker, avatarOptions, type AvatarOption } from "@/components/AvatarPicker";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import type { EditableProfileData } from "./profile-constants";

interface ProfileAvatarProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
}

export function ProfileAvatar({ displayData, editData, setEditData, isEditing }: ProfileAvatarProps) {
  const avatarUrl = isEditing ? editData.avatar_url : displayData.avatar_url;
  const username = isEditing ? editData.username : displayData.username;

  return (
    <div className="flex-shrink-0">
      <div className="relative">
        {isEditing ? (
          <button onClick={() => {}} className="relative group">
            <div className="w-32 h-40 bg-muted rounded-lg overflow-hidden border-2 border-border group-hover:border-primary/50 transition-all">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                  INGET FOTO
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 className="w-6 h-6 text-white" />
            </div>
          </button>
        ) : (
          <div className="w-32 h-40 bg-muted rounded-lg overflow-hidden border-2 border-border">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                INGET FOTO
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <>
          <AvatarPicker
            selectedAvatarId={editData.avatar_url ? avatarOptions.find((a) => a.src === editData.avatar_url)?.id : undefined}
            onSelect={(avatar: AvatarOption) => setEditData({ ...editData, avatar_url: avatar.src })}
            className="mt-3 max-w-xs"
          />
          <ProfilePhotoUpload onUploadComplete={() => {}} />
        </>
      )}
    </div>
  );
}
