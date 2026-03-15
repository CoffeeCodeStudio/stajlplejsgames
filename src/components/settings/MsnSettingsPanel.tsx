/**
 * @module MsnSettingsPanel
 * MSN Messenger "Tools > Options" style settings panel (Windows XP era).
 * Left sidebar with category icons, right panel with category content.
 */
import { useState } from "react";
import { User, Shield, Bell, Volume2, Wifi, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MsnSettingsPersonal } from "./MsnSettingsPersonal";
import { MsnSettingsPrivacy } from "./MsnSettingsPrivacy";
import { MsnSettingsNotifications } from "./MsnSettingsNotifications";
import { MsnSettingsSounds } from "./MsnSettingsSounds";
import { MsnSettingsConnection } from "./MsnSettingsConnection";
import "./msn-settings.css";

type Category = "personal" | "privacy" | "notifications" | "sounds" | "connection";

const categories: { id: Category; label: string; icon: typeof User }[] = [
  { id: "personal", label: "Personligt", icon: User },
  { id: "privacy", label: "Sekretess", icon: Shield },
  { id: "notifications", label: "Aviseringar", icon: Bell },
  { id: "sounds", label: "Ljud", icon: Volume2 },
  { id: "connection", label: "Anslutning", icon: Wifi },
];

interface MsnSettingsPanelProps {
  onClose: () => void;
}

export function MsnSettingsPanel({ onClose }: MsnSettingsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("personal");

  const renderContent = () => {
    switch (activeCategory) {
      case "personal": return <MsnSettingsPersonal />;
      case "privacy": return <MsnSettingsPrivacy />;
      case "notifications": return <MsnSettingsNotifications />;
      case "sounds": return <MsnSettingsSounds />;
      case "connection": return <MsnSettingsConnection />;
    }
  };

  return (
    <div className="msn-settings-overlay">
      <div className="msn-settings-window">
        {/* XP Title Bar */}
        <div className="msn-settings-titlebar">
          <span className="msn-settings-title">⚙️ Alternativ</span>
          <button onClick={onClose} className="msn-settings-close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="msn-settings-body">
          {/* Left sidebar */}
          <div className="msn-settings-sidebar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "msn-settings-nav-item",
                    activeCategory === cat.id && "msn-settings-nav-active"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right content */}
          <div className="msn-settings-content">
            {renderContent()}
          </div>
        </div>

        {/* XP Button Bar */}
        <div className="msn-settings-footer">
          <button onClick={onClose} className="msn-settings-btn">
            OK
          </button>
          <button onClick={onClose} className="msn-settings-btn">
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}
