/**
 * Privacy settings tab — who can see/contact you.
 */
import { useState } from "react";

export function MsnSettingsPrivacy() {
  const [allowAll, setAllowAll] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [showActivity, setShowActivity] = useState(true);

  return (
    <>
      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Vem kan se dig?</h3>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={showOnline}
            onClick={() => setShowOnline(!showOnline)}
          />
          Visa min onlinestatus för andra
        </label>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={showActivity}
            onClick={() => setShowActivity(!showActivity)}
          />
          Visa vilken sida jag befinner mig på
        </label>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Meddelanden</h3>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={allowAll}
            onClick={() => setAllowAll(!allowAll)}
          />
          Tillåt alla att skicka meddelanden till mig
        </label>
        <p className="msn-settings-hint">
          Om avaktiverat kan bara dina vänner kontakta dig.
        </p>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Blockerade kontakter</h3>
        <div className="border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 p-3 min-h-[60px]">
          <p className="text-[11px] text-gray-500 italic">
            Inga blockerade kontakter.
          </p>
        </div>
        <p className="msn-settings-hint" style={{ marginTop: 4 }}>
          Du kan blockera kontakter via deras profil eller chattfönstret.
        </p>
      </div>
    </>
  );
}
