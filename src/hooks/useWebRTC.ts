import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export type CallType = "voice" | "video" | "screenshare";
export type MediaSource = "camera" | "screen";

interface PeerConnection {
  userId: string;
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
}

interface UseWebRTCOptions {
  userId: string;
  contactId: string;
}

/**
 * WebRTC peer-to-peer calling hook supporting voice, video, and screen-share.
 *
 * Uses Supabase Realtime broadcast channels for signaling (offer/answer/ICE)
 * and stores call session metadata in the `call_sessions` / `call_participants`
 * tables. Supports up to 4 participants with automatic bitrate tuning.
 *
 * @param options.userId - The local user's ID.
 * @param options.contactId - The primary remote user's ID (used for channel naming).
 * @returns Call state, media streams, and control callbacks.
 */
export function useWebRTC({ userId, contactId }: UseWebRTCOptions) {
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState<CallType>("voice");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; callType: CallType; channelName: string } | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);

  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const channelName = `call-${[userId, contactId].sort().join("-")}`;

  // Get user media based on call type
  const getUserMedia = useCallback(async (type: CallType, source: MediaSource = "camera"): Promise<MediaStream> => {
    if (type === "voice") {
      return navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
        video: false,
      });
    }
    
    if (source === "screen") {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
        audio: true,
      });
      // Also get mic audio
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
        });
        // Combine screen video + screen audio + mic audio
        const combinedStream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...screenStream.getAudioTracks(),
          ...micStream.getAudioTracks(),
        ]);
        return combinedStream;
      } catch {
        // If mic fails, just use screen stream
        return screenStream;
      }
    }
    
    // Camera video
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
    });
  }, []);

  // Create peer connection for a specific user
  const createPeerConnection = useCallback((remoteUserId: string): PeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const remoteStream = new MediaStream();

    // Add local tracks with bitrate optimization
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, localStreamRef.current!);
        if (track.kind === 'video') {
          setTimeout(async () => {
            try {
              const params = sender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              params.encodings[0].maxBitrate = 6_000_000; // 6 Mbps for 1080p60
              params.encodings[0].maxFramerate = 60;
              if ('latencyMode' in params.encodings[0]) {
                (params.encodings[0] as any).latencyMode = 'realtime';
              }
              // Prefer hardware-accelerated VP9 or H264
              params.encodings[0].scaleResolutionDownBy = 1.0;
              await sender.setParameters(params);
            } catch (e) {
              console.warn('Could not set bitrate params:', e);
            }
          }, 500);
        }
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      setRemoteStreams((prev) => new Map(prev).set(remoteUserId, remoteStream));
    };

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: {
            from: userId,
            to: remoteUserId,
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        removePeer(remoteUserId);
      }
    };

    const peer: PeerConnection = { userId: remoteUserId, pc, remoteStream };
    peersRef.current.set(remoteUserId, peer);
    return peer;
  }, [userId]);

  const removePeer = useCallback((remoteUserId: string) => {
    const peer = peersRef.current.get(remoteUserId);
    if (peer) {
      peer.pc.close();
      peersRef.current.delete(remoteUserId);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(remoteUserId);
        return next;
      });
      setParticipants((prev) => prev.filter((p) => p !== remoteUserId));
    }
  }, []);

  // Start a call
  const startCall = useCallback(async (type: CallType, source: MediaSource = "camera") => {
    try {
      const stream = await getUserMedia(type, source);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallType(type);
      setCallActive(true);

      // Create call session in DB
      const { data: session } = await supabase
        .from("call_sessions")
        .insert({ caller_id: userId, channel_name: channelName, call_type: type })
        .select()
        .single();
      
      if (session) {
        setCallSessionId(session.id);
        await supabase.from("call_participants").insert({ call_id: session.id, user_id: userId });
      }

      // Join signaling channel
      const channel = supabase.channel(channelName);
      channelRef.current = channel;

      channel
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (payload.to !== userId) return;
          const peer = createPeerConnection(payload.from);
          await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await peer.pc.createAnswer();
          await peer.pc.setLocalDescription(answer);
          channel.send({
            type: "broadcast",
            event: "answer",
            payload: { from: userId, to: payload.from, sdp: answer },
          });
          setParticipants((prev) => [...new Set([...prev, payload.from])]);
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (payload.to !== userId) return;
          const peer = peersRef.current.get(payload.from);
          if (peer) {
            await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          }
        })
        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          if (payload.to !== userId) return;
          const peer = peersRef.current.get(payload.from);
          if (peer) {
            await peer.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        })
        .on("broadcast", { event: "join" }, async ({ payload }) => {
          if (payload.userId === userId) return;
          // New user joined, create offer
          const peer = createPeerConnection(payload.userId);
          const offer = await peer.pc.createOffer();
          await peer.pc.setLocalDescription(offer);
          channel.send({
            type: "broadcast",
            event: "offer",
            payload: { from: userId, to: payload.userId, sdp: offer },
          });
          setParticipants((prev) => [...new Set([...prev, payload.userId])]);
        })
        .on("broadcast", { event: "leave" }, ({ payload }) => {
          removePeer(payload.userId);
        })
        .subscribe(() => {
          // Announce join
          channel.send({ type: "broadcast", event: "join", payload: { userId, callType: type } });
        });

      // Handle screen share track ending (user clicks "Stop sharing")
      if (source === "screen") {
        stream.getVideoTracks().forEach((track) => {
          track.onended = () => endCall();
        });
      }
    } catch (err) {
      console.error("Failed to start call:", err);
      throw err;
    }
  }, [userId, channelName, getUserMedia, createPeerConnection, removePeer]);

  // Answer incoming call
  const answerCall = useCallback(async (incomingChannelName: string, type: CallType) => {
    try {
      const stream = await getUserMedia(type);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallType(type);
      setCallActive(true);
      setIncomingCall(null);

      const channel = supabase.channel(incomingChannelName);
      channelRef.current = channel;

      channel
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (payload.to !== userId) return;
          const peer = createPeerConnection(payload.from);
          await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await peer.pc.createAnswer();
          await peer.pc.setLocalDescription(answer);
          channel.send({
            type: "broadcast",
            event: "answer",
            payload: { from: userId, to: payload.from, sdp: answer },
          });
          setParticipants((prev) => [...new Set([...prev, payload.from])]);
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (payload.to !== userId) return;
          const peer = peersRef.current.get(payload.from);
          if (peer) {
            await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          }
        })
        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          if (payload.to !== userId) return;
          const peer = peersRef.current.get(payload.from);
          if (peer) {
            await peer.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        })
        .on("broadcast", { event: "join" }, async ({ payload }) => {
          if (payload.userId === userId) return;
          const peer = createPeerConnection(payload.userId);
          const offer = await peer.pc.createOffer();
          await peer.pc.setLocalDescription(offer);
          channel.send({
            type: "broadcast",
            event: "offer",
            payload: { from: userId, to: payload.userId, sdp: offer },
          });
          setParticipants((prev) => [...new Set([...prev, payload.userId])]);
        })
        .on("broadcast", { event: "leave" }, ({ payload }) => {
          removePeer(payload.userId);
        })
        .subscribe(() => {
          channel.send({ type: "broadcast", event: "join", payload: { userId, callType: type } });
        });
    } catch (err) {
      console.error("Failed to answer call:", err);
    }
  }, [userId, getUserMedia, createPeerConnection, removePeer]);

  // End the call
  const endCall = useCallback(() => {
    // Send leave notification
    if (channelRef.current) {
      channelRef.current.send({ type: "broadcast", event: "leave", payload: { userId } });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Close all peers
    peersRef.current.forEach((peer) => peer.pc.close());
    peersRef.current.clear();

    // Stop local media
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    // Update DB
    if (callSessionId) {
      supabase.from("call_sessions").update({ ended_at: new Date().toISOString() }).eq("id", callSessionId).then(() => {});
    }

    setLocalStream(null);
    setRemoteStreams(new Map());
    setCallActive(false);
    setCallSessionId(null);
    setParticipants([]);
    setIsMuted(false);
    setIsVideoOff(false);
  }, [userId, callSessionId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((prev) => !prev);
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsVideoOff((prev) => !prev);
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    const incomingChannel = supabase.channel(`incoming-${userId}`);
    incomingChannel
      .on("broadcast", { event: "incoming-call" }, ({ payload }) => {
        if (!callActive) {
          setIncomingCall({
            callerId: payload.callerId,
            callType: payload.callType,
            channelName: payload.channelName,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(incomingChannel);
    };
  }, [userId, callActive]);

  // Notify contact of incoming call
  const ringContact = useCallback((targetId: string, type: CallType) => {
    const ringChannel = supabase.channel(`incoming-${targetId}`);
    ringChannel.subscribe(() => {
      ringChannel.send({
        type: "broadcast",
        event: "incoming-call",
        payload: { callerId: userId, callType: type, channelName },
      });
      setTimeout(() => supabase.removeChannel(ringChannel), 2000);
    });
  }, [userId, channelName]);

  // Invite another user to an active call
  const inviteUser = useCallback((targetId: string) => {
    if (!callActive || participants.length >= 3) return; // max 4 including self
    const ringChannel = supabase.channel(`incoming-${targetId}`);
    ringChannel.subscribe(() => {
      ringChannel.send({
        type: "broadcast",
        event: "incoming-call",
        payload: { callerId: userId, callType: callType, channelName },
      });
      setTimeout(() => supabase.removeChannel(ringChannel), 2000);
    });
  }, [userId, channelName, callActive, callType, participants]);

  // Decline incoming call
  const declineCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
    callActive,
    callType,
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    incomingCall,
    participants,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    ringContact,
    inviteUser,
    declineCall,
  };
}
