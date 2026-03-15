import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq" | "besokare" | "folk";

interface MobileNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isVisible?: boolean;
}

export function MobileNav({ activeTab, onTabChange, isVisible = true }: MobileNavProps) {
  const { counts } = useNotifications();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!user) {
    return (
      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-[100] mobile-tab-bar pb-safe transition-transform duration-300",
        !isVisible && "translate-y-full"
      )}>
        <div className="flex items-center justify-center h-[56px]">
          <button
            onClick={() => onTabChange("hem")}
            className={cn("mobile-tab-item-compact", activeTab === "hem" && "active")}
          >
            <span className="mobile-tab-icon-compact">🏠</span>
            <span className="mobile-tab-label-compact">HEM</span>
          </button>
        </div>
      </nav>
    );
  }

  const mainTabs: { id: Tab; emoji: string; label: string; badge?: number }[] = [
    { id: "hem", emoji: "🏠", label: "HEM" },
    { id: "folk", emoji: "🌐", label: "FOLK" },
    { id: "mejl", emoji: "✉️", label: "MEJL", badge: counts.unreadMail > 0 ? counts.unreadMail : undefined },
    { id: "chatt", emoji: "🖊️", label: "CHATT" },
    { id: "profil", emoji: "👤", label: "PROFIL", badge: counts.guestbookNew > 0 ? counts.guestbookNew : undefined },
  ];

  const moreTabs: { id: Tab; emoji: string; label: string; badge?: number }[] = [
    { id: "vanner", emoji: "❤️", label: "Vänner" },
    { id: "gastbok", emoji: "👣", label: "Gästbok" },
    { id: "besokare", emoji: "👀", label: "Spanare", badge: counts.newVisitors > 0 ? counts.newVisitors : undefined },
    { id: "lajv", emoji: "🎭", label: "Lajv" },
    { id: "traffar", emoji: "📅", label: "Träffar" },
    { id: "klotterplanket", emoji: "🎨", label: "Klotter" },
    { id: "spel", emoji: "🎮", label: "Spel" },
    { id: "faq", emoji: "❓", label: "FAQ" },
  ];

  const isMoreActive = moreTabs.some((t) => t.id === activeTab);
  const totalMoreBadges = moreTabs.reduce((sum, t) => sum + (t.badge ?? 0), 0);

  return (
    <nav className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-[100] mobile-tab-bar pb-safe transition-transform duration-300",
      !isVisible && "translate-y-full"
    )}>
      <div className="flex items-center justify-around h-[56px] px-1">
        {mainTabs.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn("mobile-tab-item-compact", activeTab === item.id && "active")}
          >
            <div className="relative">
              <span className="mobile-tab-icon-compact">{item.emoji}</span>
              {item.badge && item.badge > 0 && (
                <span className="mobile-tab-badge-compact">{item.badge > 9 ? "9+" : item.badge}</span>
              )}
            </div>
            <span className="mobile-tab-label-compact">{item.label}</span>
          </button>
        ))}

        {/* MORE button with dropdown */}
        <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
          <DropdownMenuTrigger asChild>
            <button className={cn("mobile-tab-item-compact", isMoreActive && "active")}>
              <div className="relative">
                <span className="mobile-tab-icon-compact">⋯</span>
                {totalMoreBadges > 0 && (
                  <span className="mobile-tab-badge-compact">{totalMoreBadges > 9 ? "9+" : totalMoreBadges}</span>
                )}
              </div>
              <span className="mobile-tab-label-compact">MER</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            className="w-48 mb-2 bg-card border border-border"
          >
            {moreTabs.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => { onTabChange(item.id); setMoreOpen(false); }}
                className={cn("cursor-pointer gap-2 text-sm", activeTab === item.id && "bg-accent")}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto text-[10px] bg-destructive text-white rounded-full px-1.5">{item.badge}</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
