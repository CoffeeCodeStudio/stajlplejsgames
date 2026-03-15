import { LogIn, LogOut, Shield, Settings, User, ChevronDown } from "lucide-react";
import echo2000Logo from "@/assets/echo2000-logo.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { usePresence } from "@/hooks/usePresence";
import { HeaderRadio } from "./HeaderRadio";
import { GlobalSearch } from "./GlobalSearch";

type Tab =
"hem" |
"chatt" |
"gastbok" |
"mejl" |
"vanner" |
"profil" |
"klotterplanket" |
"spel" |
"traffar" |
"lajv" |
"faq" |
"besokare" |
"folk";

interface HeaderProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onMenuClick?: () => void;
}

export function Header({ activeTab = "hem", onTabChange, onMenuClick }: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { counts } = useNotifications();
  const { onlineUsers } = usePresence();
  const [onlineBotCount, setOnlineBotCount] = useState(0);

  // Count bots with recent last_seen as "online"
  useEffect(() => {
    const fetchBotCount = async () => {
      const eightMinAgo = new Date(Date.now() - 8 * 60 * 1000).toISOString();
      const { count } = await supabase.
      from("profiles").
      select("*", { count: "exact", head: true }).
      eq("is_bot", true).
      gte("last_seen", eightMinAgo);
      setOnlineBotCount(count ?? 0);
    };
    fetchBotCount();
    const interval = setInterval(fetchBotCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = onlineUsers.size + onlineBotCount;

  // Determine which nav items have notifications
  const getHasNotice = (id: Tab): boolean => {
    switch (id) {
      case "mejl":
        return counts.unreadMail > 0;
      case "vanner":
        return counts.pendingFriends > 0;
      case "gastbok":
        return counts.guestbookNew > 0;
      case "lajv":
        return counts.lajvActive > 0;
      case "besokare":
        return counts.newVisitors > 0;
      default:
        return false;
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin"
        });
        setIsAdmin(data === true);
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Fel vid utloggning",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Du är utloggad",
        description: "Ses snart igen!"
      });
    }
  };

  // Home button (separate zone)
  const homeItem = { id: "hem" as Tab, label: "HEM", emoji: "🏠", animationClass: "scale-in" };

  // Private zone items (middle group)
  const privateZoneItems: {id: Tab;label: string;emoji: string;animationClass: string;}[] = [
  { id: "gastbok", label: "GÄST", emoji: "👣", animationClass: "footsteps" },
  { id: "mejl", label: "MEJL", emoji: "✉️", animationClass: "msn-bounce" },
  { id: "chatt", label: "EMN", emoji: "🖊️", animationClass: "writing-pen" },
  { id: "vanner", label: "VÄNNER", emoji: "❤️", animationClass: "heart-pulse" },
  { id: "profil", label: "PROFIL", emoji: "👤", animationClass: "scale-in" },
  { id: "besokare" as Tab, label: "SPANARE", emoji: "👀", animationClass: "scale-in" }];


  // Community zone items (right group)
  const communityZoneItems: {id: Tab;label: string;emoji: string;animationClass: string;}[] = [
  { id: "folk", label: "FOLK", emoji: "🌐", animationClass: "scale-in" },
  { id: "klotterplanket", label: "KLOTTER", emoji: "🎨", animationClass: "writing-pen" },
  { id: "traffar", label: "TRÄFFAR", emoji: "📅", animationClass: "msn-bounce" },
  { id: "spel", label: "SPEL", emoji: "🎮", animationClass: "scale-in" },
  { id: "lajv", label: "LAJV", emoji: "🎭", animationClass: "heart-pulse" },
  { id: "faq", label: "FAQ", emoji: "❓", animationClass: "msn-bounce" }];


  // Render nav item helper
  const renderNavItem = (item: {id: Tab;label: string;emoji: string;animationClass: string;}, isHome = false) => {
    const hasNotice = getHasNotice(item.id);
    return (
      <div
        key={item.id}
        onClick={() => onTabChange?.(item.id)}
        className={cn(
          isHome ? "nav-item-home" : "nav-item-grouped",
          "shrink-0",
          activeTab === item.id && "active",
          !isHome && (hasNotice ? "has-notice" : "inactive")
        )}
        role="button"
        tabIndex={0}
        aria-label={item.label}>

        <span className={cn(isHome ? "icon-home" : "icon-grouped", hasNotice && item.animationClass)}>
          {item.emoji}
        </span>
        <span className={isHome ? "label-home" : "label-grouped"}>{item.label}</span>
      </div>);

  };

  // Render compact header nav item
  const renderHeaderNavItem = (item: {id: Tab;label: string;emoji: string;animationClass: string;}) => {
    const hasNotice = getHasNotice(item.id);
    return (
      <div
        key={item.id}
        onClick={() => onTabChange?.(item.id)}
        className={cn(
          "header-nav-item",
          activeTab === item.id && "active",
          hasNotice && "has-notice"
        )}
        role="button"
        tabIndex={0}
        aria-label={item.label}>

        <span className={cn("header-nav-icon", hasNotice && item.animationClass)}>
          {item.emoji}
        </span>
        <span className="header-nav-label">{item.label}</span>
        {hasNotice && <span className="header-nav-dot" />}
      </div>);

  };

  return (
    <header className="sticky top-0 z-50">
      {/* Marquee ticker - hidden on very small screens to save space */}
      <div className="hidden sm:block bg-primary/10 border-b border-border overflow-hidden">
        <div className="marquee-container">
          <span className="marquee-text text-xs text-primary font-medium">
            ⭐ Välkommen till Echo2000 — Nordens nostalgiska community! 🎮 Chatta, träffa nya vänner och reliv 2000-talet! 🦋 Alpha-version — nya funktioner släpps löpande! ✨ Tack för att du är en tidig medlem! 💖
          </span>
        </div>
      </div>
      {/* Single compact header bar */}
      <div className="navbar-dark">
        {/* ECHO2000 Logo */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div
            className="cursor-pointer relative group flex items-center shrink-0"
            onClick={() => onTabChange?.("hem")}
            role="button"
            tabIndex={0}>
            <img
              alt="Echo2000"
              className="h-6 sm:h-7 w-auto object-contain max-w-[100px] sm:max-w-[120px]"
              style={{ flexShrink: 0 }}
              src="/lovable-uploads/8fa3ad97-e123-4eb1-87e7-aca699e44627.png"
            />
          </div>
          <span className="alpha-badge">ALPHA</span>
        </div>

        {/* Global Search */}
        <div className="hidden sm:block shrink min-w-0">
          <GlobalSearch />
        </div>

        {/* Desktop nav items – visible from md breakpoint */}
        {user &&
        <nav className="hidden md:flex items-center gap-0.5 mx-2 shrink-0 grow-0">
            {privateZoneItems.map((item) => renderHeaderNavItem(item))}
          </nav>
        }
        <nav className="hidden md:flex items-center gap-0.5 shrink-0 grow-0">
          {user ?
          [homeItem, ...communityZoneItems].map((item) => renderHeaderNavItem(item)) :
          renderHeaderNavItem(homeItem)
          }
        </nav>

        {/* Right side - Auth & Status */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
          {!loading &&
          <>
              {user ?
            <>
                  {isAdmin &&
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-foreground hover:bg-muted text-xs gap-1 px-2 sm:px-3 min-h-[44px] min-w-[44px]"
                aria-label="Admin">
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
              }
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:bg-muted text-xs gap-1 px-2 sm:px-3 min-h-[44px] min-w-[44px]"
                    aria-label="Användarmeny">
                        <User className="w-4 h-4" />
                        <ChevronDown className="w-3 h-3 hidden sm:inline" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
                      <DropdownMenuItem onClick={() => onTabChange?.("profil")} className="cursor-pointer gap-2">
                        <User className="w-4 h-4" /> Profil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer gap-2">
                        <Settings className="w-4 h-4" /> Inställningar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 text-destructive">
                        <LogOut className="w-4 h-4" /> Logga ut
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </> :

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-foreground hover:bg-muted text-xs gap-1 px-2 sm:px-3 min-h-[44px] min-w-[44px]"
              aria-label="Logga in">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Logga in</span>
                </Button>
            }
            </>
          }

          {/* Radio control */}
          <HeaderRadio />

          {/* Status Box */}
          <div className="status-box-dark">
            <div className="online-dot-dark"></div>
            <span className="count-dark hidden sm:inline">{onlineCount} JUST NU</span>
            <span className="count-dark sm:hidden">{onlineCount}</span>
          </div>
        </div>
      </div>
    </header>);

}