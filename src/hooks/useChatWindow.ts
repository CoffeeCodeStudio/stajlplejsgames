/**
 * @module useChatWindow
 * Manages all state and side-effects for the ChatWindow component.
 *
 * Extracted from ChatWindow.tsx to keep the component a thin render shell.
 */
import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useMsnSounds } from "@/hooks/useMsnSounds";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatTyping } from "@/hooks/useChatTyping";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { LayoutContext } from "@/components/SharedLayout";
import type { UserStatus } from "@/components/StatusIndicator";
import type { MsnContact } from "@/components/chat/MsnContactList";

export interface DisplayMessage {
  id: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
  senderName: string;
  senderAvatar?: string;
  date: Date;
}

export function useChatWindow() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userStatus, setUserStatus] = useState<UserStatus>("online");
  const [selectedContact, setSelectedContact] = useState<MsnContact | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showContactList, setShowContactList] = useState(true);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const { playSound } = useMsnSounds();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const {
    messages: dbMessages,
    loading: messagesLoading,
    sendMessage: sendDbMessage,
  } = useChatMessages(selectedContact?.id || null);

  const webrtc = useWebRTC({
    userId: user?.id || "",
    contactId: selectedContact?.id || "",
  });

  // Typing indicator from bots/other users
  const contactTyping = useChatTyping(user?.id, selectedContact?.id || null);

  const context = useOutletContext<LayoutContext>();
  const setHideNavbar = context?.setHideNavbar;

  // ---------------------------------------------------------------------------
  // Side-effects
  // ---------------------------------------------------------------------------

  // Hide navbar when input is focused on mobile
  useEffect(() => {
    if (isMobile && setHideNavbar) setHideNavbar(inputFocused);
    return () => {
      if (setHideNavbar) setHideNavbar(false);
    };
  }, [inputFocused, isMobile, setHideNavbar]);

  // Listen for incoming nudges via realtime broadcast
  useEffect(() => {
    if (!user) return;
    const nudgeChannel = supabase.channel(`nudge-${user.id}`);
    nudgeChannel
      .on("broadcast", { event: "nudge" }, ({ payload }) => {
        if (payload.from === user.id) return;
        const chatWindow = document.getElementById("msn-chat-window");
        if (chatWindow) {
          chatWindow.classList.add("animate-shake");
          setTimeout(() => chatWindow.classList.remove("animate-shake"), 500);
        }
        if (soundEnabled) playSound("nudge");
      })
      .subscribe();
    return () => {
      supabase.removeChannel(nudgeChannel);
    };
  }, [user, soundEnabled, playSound]);

  // ---------------------------------------------------------------------------
  // Mapped messages
  // ---------------------------------------------------------------------------

  const currentMessages: DisplayMessage[] = dbMessages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    timestamp: new Date(msg.created_at).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    isSelf: msg.sender_id === user?.id,
    senderName:
      msg.sender_id === user?.id
        ? userDisplayName || "Du"
        : selectedContact?.name || "",
    senderAvatar:
      msg.sender_id === user?.id
        ? profile?.avatar_url || undefined
        : selectedContact?.avatar || undefined,
    date: new Date(msg.created_at),
  }));

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleLogin = (displayName: string, status: string) => {
    setUserDisplayName(displayName);
    setUserStatus(status as UserStatus);
    setIsLoggedIn(true);
    // Play sign-in sound
    if (soundEnabled) playSound("online");
  };

  const handleSelectContact = (contact: MsnContact) => {
    setSelectedContact(contact);
    if (isMobile) setMobileShowChat(true);
  };

  const handleSend = useCallback(async () => {
    if (!inputMessage.trim() || !selectedContact) return;
    const msg = inputMessage;
    setInputMessage("");
    if (soundEnabled) playSound("send");
    await sendDbMessage(msg);
  }, [inputMessage, selectedContact, soundEnabled, playSound, sendDbMessage]);

  const nudge = useCallback(async () => {
    if (!selectedContact || !user) return;
    if (soundEnabled) playSound("nudge");
    const chatWindow = document.getElementById("msn-chat-window");
    if (chatWindow) {
      chatWindow.classList.add("animate-shake");
      setTimeout(() => chatWindow.classList.remove("animate-shake"), 500);
    }
    await sendDbMessage("🔔 skickade en nudge!");
    const nudgeChannel = supabase.channel(`nudge-${selectedContact.id}`);
    nudgeChannel.subscribe(() => {
      nudgeChannel.send({
        type: "broadcast",
        event: "nudge",
        payload: { from: user.id, fromName: userDisplayName },
      });
      setTimeout(() => supabase.removeChannel(nudgeChannel), 1000);
    });
  }, [selectedContact, user, soundEnabled, playSound, sendDbMessage, userDisplayName]);

  const handleClearAllMessages = async () => {
    if (!user) return;
    try {
      const { error: e1 } = await supabase
        .from("chat_messages")
        .delete()
        .eq("sender_id", user.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("chat_messages")
        .delete()
        .eq("recipient_id", user.id);
      if (e2) throw e2;
      toast({
        title: "Meddelanden raderade",
        description: "Alla dina chattmeddelanden har raderats.",
      });
      setSelectedContact(null);
      setShowContactList(true);
      setMobileShowChat(false);
    } catch (error) {
      console.error("Error clearing messages:", error);
      toast({
        title: "Kunde inte radera",
        description: "Något gick fel, försök igen",
        variant: "destructive",
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Call helpers
  // ---------------------------------------------------------------------------

  const startVoiceCall = () => {
    if (user && selectedContact && !webrtc.callActive) {
      webrtc.startCall("voice");
      webrtc.ringContact(selectedContact.id, "voice");
    }
  };

  const startVideoCall = () => {
    if (user && selectedContact && !webrtc.callActive) {
      webrtc.startCall("video", "camera");
      webrtc.ringContact(selectedContact.id, "video");
    }
  };

  const startScreenShare = () => {
    if (user && selectedContact && !webrtc.callActive) {
      webrtc.startCall("screenshare", "screen");
      webrtc.ringContact(selectedContact.id, "screenshare");
    }
  };

  return {
    // Auth / login
    isLoggedIn,
    handleLogin,
    userDisplayName,
    userStatus,

    // Contacts
    selectedContact,
    showContactList,
    handleSelectContact,

    // Messages
    currentMessages,
    messagesLoading,
    contactTyping,
    inputMessage,
    setInputMessage,
    handleSend,
    handleClearAllMessages,

    // Mobile
    isMobile,
    mobileShowChat,
    setMobileShowChat,
    setInputFocused,

    // Sound
    soundEnabled,
    setSoundEnabled,

    // Calls
    webrtc,
    showInviteDialog,
    setShowInviteDialog,
    startVoiceCall,
    startVideoCall,
    startScreenShare,
    nudge,

    // Misc
    user,
  };
}
