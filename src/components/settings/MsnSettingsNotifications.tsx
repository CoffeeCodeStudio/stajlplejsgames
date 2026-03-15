/**
 * Notifications settings tab — toggle alerts.
 */
import { useState } from "react";

export function MsnSettingsNotifications() {
  const [msgAlerts, setMsgAlerts] = useState(true);
  const [nudgeAlerts, setNudgeAlerts] = useState(true);
  const [signInAlerts, setSignInAlerts] = useState(true);
  const [mailAlerts, setMailAlerts] = useState(true);

  return (
    <>
      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Meddelanden</h3>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={msgAlerts}
            onClick={() => setMsgAlerts(!msgAlerts)}
          />
          Visa avisering vid nytt meddelande
        </label>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={nudgeAlerts}
            onClick={() => setNudgeAlerts(!nudgeAlerts)}
          />
          Visa avisering vid nudge
        </label>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Kontakter</h3>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={signInAlerts}
            onClick={() => setSignInAlerts(!signInAlerts)}
          />
          Visa när en kontakt loggar in
        </label>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Mejl</h3>
        <label className="msn-settings-label">
          <div
            className="msn-settings-toggle"
            data-checked={mailAlerts}
            onClick={() => setMailAlerts(!mailAlerts)}
          />
          Visa avisering vid nytt mejl
        </label>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Förhandsvisning</h3>
        <p className="msn-settings-hint">
          Aviseringar visas som en kort popup i hörnet av skärmen, precis som i MSN Messenger.
        </p>
      </div>
    </>
  );
}
