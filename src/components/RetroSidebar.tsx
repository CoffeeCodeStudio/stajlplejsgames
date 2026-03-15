/**
 * @module RetroSidebar
 * Always-visible retro sidebar for desktop – LunarStorm/Playahead inspired.
 * Shows all navigation items, online users count, and community status.
 */
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { usePresence } from "@/hooks/usePresence";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "./Avatar";

type Tab =
  | "hem"
  | "chatt"
  | "gastbok"
  | "mejl"
  | "vanner"
  | "profil"
  | "klotterplanket"
  | "spel"
  | "traffar"
  | "lajv"
  | "faq"
  | "folk";

interface RetroSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function RetroSidebar({ activeTab, onTabChange }: RetroSidebarProps) {
  const { user } = useAuth();
  const { counts } = useNotifications();
  const { onlineUsers } = usePresence();
  const { profile } = useProfile();

  const onlineCount = onlineUsers.size;

  const getBadge = (id: Tab): number | undefined => {
    switch (id) {
      case "mejl":
        return counts.unreadMail > 0 ? counts.unreadMail : undefined;
      case "vanner":
        return counts.pendingFriends > 0 ? counts.pendingFriends : undefined;
      case "gastbok":
        return counts.guestbookNew > 0 ? counts.guestbookNew : undefined;
      case "lajv":
        return counts.lajvActive > 0 ? counts.lajvActive : undefined;
      default:
        return undefined;
    }
  };

  // All nav items in logical groups
  const personalItems: { id: Tab; label: string; emoji: string }[] = [
    { id: "profil", label: "Min Profil", emoji: "👤" },
    { id: "gastbok", label: "Gästbok", emoji: "👣" },
    { id: "mejl", label: "Meddelanden", emoji: "✉️" },
    { id: "chatt", label: "Messenger", emoji: "🖊️" },
    { id: "vanner", label: "Vänner", emoji: "❤️" },
  ];

  const communityItems: { id: Tab; label: string; emoji: string }[] = [
    { id: "folk", label: "Folk", emoji: "🌐" },
    { id: "klotterplanket", label: "Klotterplanket", emoji: "🎨" },
    { id: "lajv", label: "Lajv", emoji: "🎭" },
    { id: "traffar", label: "Träffar", emoji: "📅" },
    { id: "spel", label: "Spel", emoji: "🎮" },
  ];

  const renderNavItem = (item: { id: Tab; label: string; emoji: string }) => {
    const badge = getBadge(item.id);
    const isActive = activeTab === item.id;
    const hasNotice = badge !== undefined && badge > 0;

    return (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        className={cn(
          "retro-sidebar-item",
          isActive && "active",
          hasNotice && "has-notice",
          !isActive && !hasNotice && "inactive"
        )}
      >
        <span className={cn("retro-sidebar-emoji", hasNotice && "animate-icon-bounce")}>
          {item.emoji}
        </span>
        <span className="retro-sidebar-label">{item.label}</span>
        {hasNotice && (
          <span className="retro-sidebar-badge">{badge}</span>
        )}
      </button>
    );
  };

  return (
    <aside className="retro-sidebar hidden lg:flex">
      {/* User card at top */}
      {user && profile && (
        <div className="retro-sidebar-box retro-sidebar-user" onClick={() => onTabChange("profil")}>
          <Avatar
            src={profile.avatar_url || undefined}
            name={profile.username}
            size="md"
            showStatus
            status="online"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">{profile.username}</p>
            <p className="text-xs text-muted-foreground truncate italic">
              {profile.status_message || "Drömmer VHS drömmar!"}
            </p>
          </div>
        </div>
      )}

      {/* Online status box */}
      <div className="retro-sidebar-box retro-sidebar-status">
        <div className="flex items-center gap-2">
          <div className="online-dot-dark" />
          <span className="text-xs font-bold text-foreground">{onlineCount} online just nu</span>
        </div>
      </div>

      {/* Navigation: Personal */}
      <div className="retro-sidebar-box">
        <div className="retro-sidebar-group-label">🔒 Mitt</div>
        <nav className="retro-sidebar-nav">
          {user ? (
            personalItems.map(renderNavItem)
          ) : (
            <button
              onClick={() => onTabChange("hem")}
              className={cn("retro-sidebar-item", activeTab === "hem" && "active")}
            >
              <span className="retro-sidebar-emoji">🏠</span>
              <span className="retro-sidebar-label">Hem</span>
            </button>
          )}
        </nav>
      </div>

      {/* Navigation: Community */}
      {user && (
        <div className="retro-sidebar-box">
          <div className="retro-sidebar-group-label">🌐 Community</div>
          <nav className="retro-sidebar-nav">
            {communityItems.map(renderNavItem)}
          </nav>
        </div>
      )}

      {/* Quick links */}
      <div className="retro-sidebar-box">
        <nav className="retro-sidebar-nav">
          <button
            onClick={() => onTabChange("hem")}
            className={cn("retro-sidebar-item", activeTab === "hem" && "active")}
          >
            <span className="retro-sidebar-emoji">🏠</span>
            <span className="retro-sidebar-label">Startsidan</span>
          </button>
          <button
            onClick={() => onTabChange("faq")}
            className={cn("retro-sidebar-item", activeTab === "faq" && "active")}
          >
            <span className="retro-sidebar-emoji">❓</span>
            <span className="retro-sidebar-label">FAQ</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
