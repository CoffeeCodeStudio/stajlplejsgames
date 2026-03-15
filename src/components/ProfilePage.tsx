/**
 * @module ProfilePage
 * Main profile page component. Delegates rendering to sub-components in
 * `./profile/` for maintainability.
 */
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ProfileGuestbook } from "./ProfileGuestbook";
import { VisitorLog } from "./VisitorLog";
import { useProfileVisits } from "@/hooks/useProfileVisits";
import { ProfileFriendsTab } from "./ProfileFriendsTab";
import { usePresence } from "@/hooks/usePresence";
import type { UserStatus } from "./StatusIndicator";

import { ProfileHeaderBar } from "./profile/ProfileHeaderBar";
import { ProfileTabs, type ProfileTabId } from "./profile/ProfileTabs";
import { ProfileInfoSection } from "./profile/ProfileInfoSection";
import {
  type EditableProfileData,
  demoProfile,
  toEditableData,
} from "./profile/profile-constants";

interface ProfilePageProps {
  userId?: string;
  initialTab?: ProfileTabId;
}

export function ProfilePage({ userId, initialTab }: ProfilePageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, saving, isOwnProfile, updateProfile } = useProfile(userId);
  const { visitors } = useProfileVisits(userId);
  const { getUserStatus, getUserActivity } = usePresence();

  const isLoggedIn = !!user;
  const showDemoMode = !isLoggedIn && !userId;

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTabId>(initialTab || "profil");
  const [editData, setEditData] = useState<EditableProfileData>(toEditableData(null));

  // Sync initialTab when it changes from parent
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Sync editData when profile loads
  useEffect(() => {
    if (profile) setEditData(toEditableData(profile));
  }, [profile]);

  const handleSave = async () => {
    await updateProfile(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (profile) setEditData(toEditableData(profile));
    setIsEditing(false);
  };

  // Loading state
  if (loading && !showDemoMode) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Laddar profil...</p>
        </div>
      </div>
    );
  }

  // Profile not found
  if (!showDemoMode && !profile && userId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h2 className="font-display font-bold text-xl mb-4">Profil hittades inte</h2>
          <p className="text-muted-foreground">Denna profil finns inte.</p>
        </div>
      </div>
    );
  }

  // Determine display data
  const displayData: EditableProfileData = showDemoMode
    ? demoProfile
    : isEditing
      ? editData
      : toEditableData(profile);

  const profileUserId = profile?.user_id || userId || user?.id;

  // Derive status: use presence for real users, last_seen fallback for bots
  const presenceStatus: UserStatus = profileUserId ? getUserStatus(profileUserId) : "offline";
  const userStatus: UserStatus = (() => {
    // If presence says online/away, trust it
    if (presenceStatus !== "offline") return presenceStatus;
    // Fallback: check last_seen (critical for bots who don't use Presence channel)
    if (profile?.last_seen) {
      const lastSeenMs = Date.now() - new Date(profile.last_seen).getTime();
      if (lastSeenMs < 3 * 60 * 1000) return "online";    // < 3 min
      if (lastSeenMs < 8 * 60 * 1000) return "away";      // 3-8 min
    }
    return "offline";
  })();

  const userActivity = profileUserId ? getUserActivity(profileUserId) : undefined;
  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString("sv-SE", { year: "numeric", month: "long" })
    : "December 2025";
  const lastSeen = profile?.last_seen
    ? new Date(profile.last_seen).toLocaleDateString("sv-SE", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic bg-background">
      {/* Demo Mode Banner */}
      {showDemoMode && (
        <div className="bg-accent/20 border-b border-accent px-4 py-2">
          <div className="container flex items-center justify-between">
            <p className="text-sm text-accent-foreground">
              👀 <strong>Demo-läge:</strong> Detta är en exempelprofil. Logga in för att skapa din egen!
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate("/auth")} className="text-xs">
              Skapa konto
            </Button>
          </div>
        </div>
      )}

      <ProfileHeaderBar
        displayData={displayData}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        saving={saving}
        showDemoMode={showDemoMode}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isOwnProfile={isOwnProfile} />

      {/* Tab content */}
      <div className="container px-4 py-4 max-w-5xl mx-auto">
        {activeTab === "profil" && (
          <ProfileInfoSection
            displayData={displayData}
            editData={editData}
            setEditData={setEditData}
            isEditing={isEditing}
            isOwnProfile={isOwnProfile}
            userId={userId}
            userStatus={userStatus}
            userActivity={userActivity}
            lastSeen={lastSeen}
            memberSince={memberSince}
          />
        )}

        {activeTab === "gastbok" && profileUserId && (
          <div className="bg-card rounded-lg border border-border p-4">
            <ProfileGuestbook profileOwnerId={profileUserId} isOwnProfile={isOwnProfile} />
          </div>
        )}

        {activeTab === "gastbok" && !profileUserId && (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">📝 Här var det tomt! Skriv något vetja.</p>
          </div>
        )}

        {activeTab === "besokare" && isOwnProfile && profileUserId && (
          <div className="bg-card rounded-lg border border-border p-4">
            <VisitorLog visitors={visitors} />
          </div>
        )}

        {activeTab === "vanner" && profileUserId && (
          <div className="bg-card rounded-lg border border-border p-4">
            <ProfileFriendsTab userId={profileUserId} />
          </div>
        )}

        {activeTab === "vanner" && !profileUserId && (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">🌟 Inga vänner ännu</p>
          </div>
        )}

        {activeTab === "blog" && (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">Inga blogginlägg ännu.</p>
          </div>
        )}

        {activeTab === "album" && (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">Inga album uppladdade.</p>
          </div>
        )}
      </div>
    </div>
  );
}
