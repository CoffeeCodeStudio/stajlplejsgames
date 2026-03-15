import { useState, useEffect } from "react";
import { useOutletContext, useLocation, useNavigate } from "react-router-dom";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { HomeContent } from "@/components/HomeContent";
import { ProfilePage } from "@/components/ProfilePage";
// Guestbook import removed - unified into ProfilePage
import { Mailbox } from "@/components/social/Mailbox";
import { FriendsList } from "@/components/friends/FriendsList";
import { MemberGrid } from "@/components/social/MemberGrid";
import { Klotterplanket } from "@/components/social/Klotterplanket";
import { GamesSection } from "@/components/games/GamesSection";
import { LockedMeetups } from "@/components/social/LockedMeetups";
import { LajvSection } from "@/components/social/LajvSection";
import { FAQSection } from "@/components/FAQSection";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePresence } from "@/hooks/usePresence";
import { useNotifications } from "@/hooks/useNotifications";
import type { LayoutContext } from "@/components/SharedLayout";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq" | "besokare" | "folk";


export default function Index() {
  const location = useLocation();
  const context = useOutletContext<LayoutContext>();
  
  // Use context from SharedLayout
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen, handleUnreadCountChange } = context || {
    activeTab: "hem" as Tab,
    setActiveTab: () => {},
    sidebarOpen: false,
    setSidebarOpen: () => {},
    handleUnreadCountChange: () => {},
  };

  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { setActivity } = usePresence();
  const { markGuestbookRead, markVisitorsRead } = useNotifications();

  // Mark guestbook entries as read when the user opens the guestbook tab
  useEffect(() => {
    if (activeTab === 'gastbok' && user) {
      markGuestbookRead();
    }
  }, [activeTab, user, markGuestbookRead]);

  // Mark visitors as read when the user opens the besokare tab
  useEffect(() => {
    if (activeTab === 'besokare' && user) {
      markVisitorsRead();
    }
  }, [activeTab, user, markVisitorsRead]);

  // Update activity based on active tab
  useEffect(() => {
    const tabActivityMap: Record<string, string> = {
      hem: 'Surfar runt',
      chatt: 'Chattar',
      gastbok: 'Kollar gästboken',
      mejl: 'Läser mejl',
      vanner: 'Kollar vänlistan',
      folk: 'Kollar medlemmar',
      profil: 'Kollar sin profil',
      klotterplanket: 'Klottrar',
      spel: 'Spelar spel',
      traffar: 'Kollar träffar',
      lajv: 'Lajvar',
      besokare: 'Kollar sina spanare',
      faq: 'Läser FAQ',
    };
    setActivity(tabActivityMap[activeTab] || 'Surfar runt');
  }, [activeTab, setActivity]);

  // Handle tab from navigation state
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state, setActiveTab]);

  // Check if onboarding is needed (missing required profile fields)
  useEffect(() => {
    if (user && !profileLoading && profile) {
      const needsOnboarding = !profile.gender || !profile.city || !profile.age;
      setShowOnboarding(needsOnboarding);
    } else {
      setShowOnboarding(false);
    }
  }, [user, profile, profileLoading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refetchProfile();
  };

  const renderContent = () => {
    // Protected tabs require login
    const protectedTabs: Tab[] = ["chatt", "gastbok", "mejl", "vanner", "profil", "klotterplanket", "spel", "traffar", "lajv", "besokare", "folk"];
    if (!user && protectedTabs.includes(activeTab)) {
      // Redirect to auth for non-logged-in users trying to access protected tabs
      navigate("/auth", { replace: true });
      return null;
    }

    switch (activeTab) {
      case "hem":
        return <HomeContent />;

      case "chatt":
        return <ChatWindow className="flex-1" />;

      case "gastbok":
        return <ProfilePage initialTab="gastbok" />;

      case "mejl":
        return <Mailbox onUnreadCountChange={handleUnreadCountChange} />;

      case "vanner":
        return (
          <div className="flex-1 flex flex-col overflow-y-auto scrollbar-nostalgic">
            <FriendsList />
          </div>
        );

      case "folk":
        return <MemberGrid />;

      case "klotterplanket":
        return <Klotterplanket />;

      case "spel":
        return <GamesSection />;

      case "traffar":
        return <LockedMeetups />;

      case "lajv":
        return <LajvSection />;

      case "faq":
        return <FAQSection />;

      case "profil":
        return <ProfilePage />;

      case "besokare":
        return <ProfilePage initialTab="besokare" />;

      default:
        return null;
    }
  };

  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <OnboardingModal userId={user.id} onComplete={handleOnboardingComplete} />
      )}

      {renderContent()}
    </>
  );
}
