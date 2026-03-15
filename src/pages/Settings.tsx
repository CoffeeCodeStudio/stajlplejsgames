import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import { SettingsEmailChange } from "@/components/settings/SettingsEmailChange";
import { SettingsPasswordChange } from "@/components/settings/SettingsPasswordChange";
import { SettingsDeleteAccount } from "@/components/settings/SettingsDeleteAccount";
import { MsnSettingsPanel } from "@/components/settings/MsnSettingsPanel";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMsnSettings, setShowMsnSettings] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 pb-28">
      <div className="max-w-lg mx-auto space-y-6 pt-4 sm:pt-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px]">
          <ArrowLeft className="w-5 h-5" /> Tillbaka
        </button>

        <h1 className="text-2xl font-bold text-foreground">Inställningar</h1>
        <p className="text-sm text-muted-foreground">Inloggad som {user?.email}</p>

        {/* MSN Settings button */}
        <button
          onClick={() => setShowMsnSettings(true)}
          className="w-full nostalgia-card p-4 text-left hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="font-bold text-foreground text-sm">Echo Messenger — Alternativ</h2>
              <p className="text-xs text-muted-foreground">Visningsnamn, sekretess, aviseringar, ljud</p>
            </div>
          </div>
        </button>

        <SettingsEmailChange />
        <SettingsPasswordChange />
        <SettingsDeleteAccount />
      </div>

      {showMsnSettings && (
        <MsnSettingsPanel onClose={() => setShowMsnSettings(false)} />
      )}
    </div>
  );
}
