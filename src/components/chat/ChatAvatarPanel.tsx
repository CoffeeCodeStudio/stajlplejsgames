/** Right-side avatar panel showing contact + self with MSN-style frames (desktop only) */
import { useState } from "react";
import { StatusIndicator, type UserStatus } from "../StatusIndicator";
import { MsnAvatarPicker } from "./MsnAvatarPicker";
import type { MsnContact } from "./MsnContactList";

interface ChatAvatarPanelProps {
  contact: MsnContact;
  userDisplayName: string;
  userStatus: UserStatus;
  userAvatar?: string;
}

export function ChatAvatarPanel({ contact, userDisplayName, userStatus, userAvatar }: ChatAvatarPanelProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <div className="hidden xl:flex flex-col w-40 border-l border-gray-300 dark:border-gray-700 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] dark:from-gray-800 dark:to-gray-700">
        {/* Contact avatar */}
        <AvatarSlot
          name={contact.name}
          status={contact.status}
          avatar={contact.avatar}
          statusMessage={contact.statusMessage}
        />
        {/* User avatar */}
        <div className="cursor-pointer" onClick={() => setShowPicker(true)} title="Byt visningsbild">
          <AvatarSlot
            name={userDisplayName || "Du"}
            status={userStatus}
            avatar={userAvatar}
            isUser
          />
        </div>
      </div>

      <MsnAvatarPicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={() => {/* Placeholder — avatar selection logic */}}
      />
    </>
  );
}

function AvatarSlot({
  name, status, avatar, statusMessage, isUser,
}: {
  name: string; status: UserStatus; avatar?: string; statusMessage?: string; isUser?: boolean;
}) {
  return (
    <div className="flex-1 p-2 flex flex-col items-center justify-center border-b border-gray-300 dark:border-gray-600 last:border-b-0">
      <div className="relative mb-1.5">
        <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-sm flex items-center justify-center border-2 border-gray-400 dark:border-gray-600 overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={name} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1">
          <StatusIndicator status={status} size="md" />
        </div>
      </div>
      <p className="text-[11px] text-gray-700 dark:text-gray-300 truncate max-w-full text-center font-medium">
        {name}
      </p>
      {statusMessage && (
        <p className="text-[9px] text-gray-500 italic truncate max-w-full text-center">{statusMessage}</p>
      )}
      {isUser && (
        <p className="text-[9px] text-blue-600 dark:text-blue-400 mt-0.5 hover:underline cursor-pointer">
          Byt bild
        </p>
      )}
    </div>
  );
}
