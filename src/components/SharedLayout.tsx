import { useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useAuth } from "@/hooks/useAuth";

import { UnreadMailBar } from "@/components/UnreadMailBar";
import { GlobalLajvTicker } from "@/components/GlobalLajvTicker";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq" | "besokare" | "folk";

export function SharedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  const [hideNavbar, setHideNavbar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollNavVisible = useScrollDirection(15);
  const { user } = useAuth();

  const getActiveTab = (): Tab => {
    const path = location.pathname;
    if (path.startsWith("/profile")) return "profil";
    if (path === "/rum") return "chatt";
    if (path === "/auth") return "hem";
    return "hem";
  };

  const [activeTab, setActiveTab] = useState<Tab>(getActiveTab());

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (location.pathname !== "/") {
      navigate("/", { state: { tab } });
    }
  };

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadMailCount(count);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-x-hidden">
      {/* Header, Lajv ticker, and Unread mail — only for logged-in users */}
      {user && (
        <>
          <Header 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          />
          <GlobalLajvTicker />
          <UnreadMailBar 
            unreadCount={unreadMailCount} 
            onTabChange={(tab) => handleTabChange(tab as Tab)} 
          />
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden pb-[70px] md:pb-0">
        <main className="flex-1 flex overflow-hidden">
          <Outlet context={{ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, handleUnreadCountChange, hideNavbar, setHideNavbar }} />
        </main>

        {/* Footer removed */}
      </div>

      {/* Mobile bottom navigation — only for logged-in users */}
      {user && !hideNavbar && <MobileNav activeTab={activeTab} onTabChange={handleTabChange} isVisible={scrollNavVisible} />}
    </div>
  );
}

export interface LayoutContext {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleUnreadCountChange: (count: number) => void;
  hideNavbar: boolean;
  setHideNavbar: (hide: boolean) => void;
}
