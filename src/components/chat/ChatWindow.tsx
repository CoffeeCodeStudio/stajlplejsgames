/**
 * @module ChatWindow
 * MSN Messenger-style chat — thin render shell.
 *
 * All state & logic lives in {@link useChatWindow}.
 * Visual sub-sections are delegated to dedicated components.
 */
import { cn } from "@/lib/utils";
import { useChatWindow } from "@/hooks/useChatWindow";

import { MsnLogin } from "./MsnLogin";
import { MsnContactList } from "./MsnContactList";
import { ChatHeader } from "./ChatHeader";
import { ChatContactHeader } from "./ChatContactHeader";
import { ChatToolbar } from "./ChatToolbar";
import { ChatMessages } from "./ChatMessages";
import { ChatInputBar } from "./ChatInputBar";
import { ChatFooter } from "./ChatFooter";
import { ChatAvatarPanel } from "./ChatAvatarPanel";
import { ChatCallOverlays } from "./ChatCallOverlays";
import { ChatWelcomeScreen } from "./ChatWelcomeScreen";

interface ChatWindowProps {
  className?: string;
}

export function ChatWindow({ className }: ChatWindowProps) {
  const chat = useChatWindow();

  if (!chat.isLoggedIn) return <MsnLogin onLogin={chat.handleLogin} />;

  return (
    <div className={cn("flex-1 flex flex-col h-full overflow-hidden", className)}>
      <ChatHeader
        userDisplayName={chat.userDisplayName}
        userStatus={chat.userStatus}
        soundEnabled={chat.soundEnabled}
        onToggleSound={() => chat.setSoundEnabled(!chat.soundEnabled)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Contact List */}
        {chat.showContactList && (!chat.isMobile || !chat.mobileShowChat) && (
          <div
            className={cn(
              "border-r border-gray-300 dark:border-gray-700 flex-shrink-0",
              chat.isMobile ? "w-full" : "w-60"
            )}
          >
            <MsnContactList
              onSelectContact={chat.handleSelectContact}
              selectedContactId={chat.selectedContact?.id}
              soundEnabled={chat.soundEnabled}
              userDisplayName={chat.userDisplayName}
              userStatus={chat.userStatus}
            />
          </div>
        )}

        {/* Chat Area */}
        {(!chat.isMobile || chat.mobileShowChat) && (
          <div className="flex-1 flex flex-col min-w-0">
            {chat.selectedContact ? (
              <>
                <ChatCallOverlays
                  webrtc={chat.webrtc}
                  contactName={chat.selectedContact.name}
                  showInviteDialog={chat.showInviteDialog}
                  onOpenInvite={() => chat.setShowInviteDialog(true)}
                  onCloseInvite={() => chat.setShowInviteDialog(false)}
                />

                <ChatContactHeader
                  contact={chat.selectedContact}
                  isMobile={chat.isMobile}
                  onBack={() => chat.setMobileShowChat(false)}
                  onNudge={chat.nudge}
                  onVoiceCall={chat.startVoiceCall}
                  onVideoCall={chat.startVideoCall}
                  onScreenShare={chat.startScreenShare}
                />

                <ChatToolbar
                  onInvite={() => {
                    if (chat.webrtc.callActive) chat.setShowInviteDialog(true);
                  }}
                  onVoiceCall={chat.startVoiceCall}
                  onVideoCall={chat.startVideoCall}
                  onScreenShare={chat.startScreenShare}
                  onNudge={chat.nudge}
                  showInviteDialog={chat.showInviteDialog}
                  callActive={chat.webrtc.callActive}
                  callType={chat.webrtc.callType}
                />

                <ChatMessages
                  messages={chat.currentMessages}
                  loading={chat.messagesLoading}
                  contactName={chat.selectedContact.name}
                  contactTyping={!!chat.contactTyping}
                />

                <ChatInputBar
                  inputMessage={chat.inputMessage}
                  onInputChange={chat.setInputMessage}
                  onSend={chat.handleSend}
                  onFocus={() => chat.setInputFocused(true)}
                  onBlur={() => chat.setInputFocused(false)}
                  onNudge={chat.nudge}
                />
              </>
            ) : (
              <ChatWelcomeScreen />
            )}
          </div>
        )}

        {/* Right Panel - Avatars (Desktop only) */}
        {chat.selectedContact && (
          <ChatAvatarPanel
            contact={chat.selectedContact}
            userDisplayName={chat.userDisplayName}
            userStatus={chat.userStatus}
          />
        )}
      </div>

      <ChatFooter
        soundEnabled={chat.soundEnabled}
        showClearButton={!!chat.user}
        onClearAll={chat.handleClearAllMessages}
      />
    </div>
  );
}
