/**
 * Connection settings tab — placeholder with XP network styling.
 */
export function MsnSettingsConnection() {
  return (
    <>
      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Anslutningsstatus</h3>
        <div className="border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">Ansluten</span>
          </div>
          <div className="space-y-1 text-[10px] text-gray-600 dark:text-gray-400">
            <p>Server: echo2000.lovable.app</p>
            <p>Protokoll: HTTPS / WebSocket</p>
            <p>Latens: &lt;50ms</p>
          </div>
        </div>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Proxy-inställningar</h3>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Echo Messenger ansluter direkt till servern. Proxy-inställningar stöds inte för närvarande.
        </p>
      </div>

      <div className="msn-settings-group">
        <h3 className="msn-settings-group-title">Filöverföring</h3>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Filöverföring via chattfönstret kommer snart. Stöd för bilder och dokument upp till 10 MB planeras.
        </p>
      </div>
    </>
  );
}
