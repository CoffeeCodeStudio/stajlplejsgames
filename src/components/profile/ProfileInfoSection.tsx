/**
 * @module ProfileInfoSection
 * Main "PROFIL" tab content – thin render shell delegating to sub-components.
 */
import { FriendActionButtons } from "@/components/friends/FriendActionButtons";
import type { UserStatus } from "@/components/StatusIndicator";
import type { EditableProfileData } from "./profile-constants";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileBasicInfo } from "./ProfileBasicInfo";
import { ProfileFieldsGrid } from "./ProfileFieldsGrid";
import { ProfileLookingFor } from "./ProfileLookingFor";
import { ProfileBioStatus } from "./ProfileBioStatus";

interface ProfileInfoSectionProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
  isOwnProfile: boolean;
  userId?: string;
  userStatus: UserStatus;
  userActivity?: string;
  lastSeen: string | null;
  memberSince: string;
}

export function ProfileInfoSection({
  displayData, editData, setEditData, isEditing, isOwnProfile, userId,
  userStatus, userActivity, lastSeen, memberSince,
}: ProfileInfoSectionProps) {
  const drLoveScore = 73;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-6">
          <ProfileAvatar
            displayData={displayData}
            editData={editData}
            setEditData={setEditData}
            isEditing={isEditing}
          />
          <div className="flex-1 min-w-0">
            <ProfileBasicInfo
              displayData={displayData}
              editData={editData}
              setEditData={setEditData}
              isEditing={isEditing}
              userStatus={userStatus}
              userActivity={userActivity}
              lastSeen={lastSeen}
            />
            <ProfileFieldsGrid
              displayData={displayData}
              editData={editData}
              setEditData={setEditData}
              isEditing={isEditing}
            />
            <ProfileLookingFor
              displayData={displayData}
              editData={editData}
              setEditData={setEditData}
              isEditing={isEditing}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      {!isOwnProfile && userId && (
        <div className="bg-gradient-to-r from-muted/50 via-muted to-muted/50 border-t border-border px-4 py-2">
          <FriendActionButtons targetUserId={userId} targetUsername={displayData.username} />
        </div>
      )}

      {/* Dr. Love */}
      {!isOwnProfile && (
        <div className="bg-muted/30 border-t border-border px-4 py-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-accent">DR. LOVE:</span>
            <span className="text-muted-foreground">
              {drLoveScore}% kan funka om du klär ut dig till chimpans och drar ett skämt!
            </span>
          </div>
        </div>
      )}

      <ProfileBioStatus
        displayData={displayData}
        editData={editData}
        setEditData={setEditData}
        isEditing={isEditing}
        memberSince={memberSince}
      />
    </div>
  );
}
