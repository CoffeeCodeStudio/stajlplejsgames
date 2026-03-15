/**
 * @module ChatWelcomeScreen
 * Shown when no contact is selected — a friendly welcome splash.
 */
import { MsnLogo } from "./MsnLogo";

export function ChatWelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
      <MsnLogo size="lg" animated className="mb-4" />
      <h2 className="font-bold text-lg text-gray-700 dark:text-gray-300 mb-2">
        Välkommen till Echo Messenger!
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
        Välj en kontakt från listan till vänster för att starta en konversation.
      </p>
      <div className="flex gap-2 text-xs text-gray-400">
        <span>💬 Chatta</span>
        <span>•</span>
        <span>🎮 Spela</span>
        <span>•</span>
        <span>📞 Ring</span>
      </div>
    </div>
  );
}
