import { cn } from "@/lib/utils";

export type ProfileTabId = "profil" | "gastbok" | "blog" | "vanner" | "album" | "besokare";

interface ProfileTabsProps {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  isOwnProfile: boolean;
}

const baseTabs: { id: ProfileTabId; label: string }[] = [
  { id: "profil", label: "PROFIL" },
  { id: "gastbok", label: "GÄSTBOK" },
  { id: "blog", label: "BLOG" },
  { id: "vanner", label: "VÄNNER" },
  { id: "album", label: "ALBUM" },
];

/**
 * Horizontal tab bar for profile sub-pages. Shows the "BESÖKARE" tab only
 * when viewing your own profile.
 */
export function ProfileTabs({ activeTab, onTabChange, isOwnProfile }: ProfileTabsProps) {
  const tabs = isOwnProfile
    ? [...baseTabs, { id: "besokare" as ProfileTabId, label: "👀 SPANARE" }]
    : baseTabs;

  return (
    <div className="bg-card border-b border-border">
      <div className="container px-4">
        <nav className="flex items-center gap-0.5 py-1 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-3 py-2 text-xs font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap min-h-[40px]",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
