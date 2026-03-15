/**
 * @module ChatCallOverlays
 * Renders the active call window, incoming call dialog, and invite-to-call
 * dialog as overlays on top of the chat area.
 */
import { CallWindow } from "../calls/CallWindow";
import { IncomingCallDialog } from "../calls/IncomingCallDialog";
import { InviteToCallDialog } from "../calls/InviteToCallDialog";
import type { CallType } from "@/hooks/useWebRTC";

interface ChatCallOverlaysProps {
  webrtc: {
    callActive: boolean;
    callType: CallType;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    isMuted: boolean;
    isVideoOff: boolean;
    participants: string[];
    toggleMute: () => void;
    toggleVideo: () => void;
    endCall: () => void;
    incomingCall: { channelName: string; callType: string } | null;
    answerCall: (channelName: string, callType: string) => void;
    declineCall: () => void;
    inviteUser: (userId: string) => void;
  };
  contactName: string;
  showInviteDialog: boolean;
  onOpenInvite: () => void;
  onCloseInvite: () => void;
}

export function ChatCallOverlays({
  webrtc,
  contactName,
  showInviteDialog,
  onOpenInvite,
  onCloseInvite,
}: ChatCallOverlaysProps) {
  return (
    <>
      {webrtc.callActive && (
        <CallWindow
          callType={webrtc.callType}
          localStream={webrtc.localStream}
          remoteStreams={webrtc.remoteStreams}
          isMuted={webrtc.isMuted}
          isVideoOff={webrtc.isVideoOff}
          contactName={contactName}
          participants={webrtc.participants}
          onToggleMute={webrtc.toggleMute}
          onToggleVideo={webrtc.toggleVideo}
          onEndCall={webrtc.endCall}
          onInvite={onOpenInvite}
        />
      )}

      {webrtc.incomingCall && !webrtc.callActive && (
        <IncomingCallDialog
          callerName={contactName}
          callType={webrtc.incomingCall.callType as CallType}
          onAccept={() =>
            webrtc.answerCall(
              webrtc.incomingCall!.channelName,
              webrtc.incomingCall!.callType
            )
          }
          onDecline={webrtc.declineCall}
        />
      )}

      {showInviteDialog && webrtc.callActive && (
        <InviteToCallDialog
          currentParticipants={webrtc.participants}
          maxParticipants={4}
          onInvite={(userId) => webrtc.inviteUser(userId)}
          onClose={onCloseInvite}
        />
      )}
    </>
  );
}
