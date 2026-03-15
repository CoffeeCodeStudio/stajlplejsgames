/**
 * Personal settings tab — display name, status message, avatar.
 */
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { MsnAvatarPicker } from "../chat/MsnAvatarPicker";

export function MsnSettingsPersonal() {
  const { user } = useAuth();
  const { profile, updateProfile, saving } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.username || "");
      setStatusMessage(profile.status_message || "");
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile({
      username: displayName,
      status_message: statusMessage,
    });
  };

  return (
    <>
      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Visningsnamn</h3>
        <p className="msn-settings-hint" style={{ marginBottom: 6 }}>
          Det här är namnet dina kontakter ser i sin lista.
        </p>
        <input
          className="msn-settings-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ditt visningsnamn"
        />
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Personligt meddelande</h3>
        <textarea
          className="msn-settings-textarea"
          value={statusMessage}
          onChange={(e) => setStatusMessage(e.target.value)}
          placeholder="♫ Lyssnar på..."
          rows={2}
        />
        <p className="msn-settings-hint">
          Visas under ditt namn i kontaktlistan.
        </p>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Visningsbild</h3>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-sm border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-gray-400">
                {displayName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="msn-settings-btn"
          >
            Byt bild...
          </button>
        </div>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">E-post</h3>
        <input
          className="msn-settings-input"
          value={user?.email || ""}
          disabled
          style={{ opacity: 0.6 }}
        />
        <p className="msn-settings-hint">
          E-postadressen kan ändras via Inställningar &gt; Säkerhet.
        </p>
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          className="msn-settings-btn"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "4px 24px" }}
        >
          {saving ? "Sparar..." : "Spara ändringar"}
        </button>
      </div>

      <MsnAvatarPicker
        open={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelect={() => {/* placeholder */}}
      />
    </>
  );
}
