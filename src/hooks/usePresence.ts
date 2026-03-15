import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useLocation } from 'react-router-dom';
import type { UserStatus } from '@/components/StatusIndicator';

interface PresenceState {
  user_id: string;
  last_active: string;
  current_activity?: string;
}

const AWAY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const ACTIVITY_THROTTLE_MS = 30 * 1000; // Throttle activity updates to every 30s
const CHANNEL_NAME = 'echo2000-presence';

/**
 * Hook to manage user presence (online/away/offline) using Supabase Realtime Presence.
 * - Tracks the current user as online
 * - Detects away status after 5 minutes of inactivity
 * - Returns a map of online user statuses
 */
export function usePresence() {
  const { user } = useAuth();
  const location = useLocation();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserStatus>>(new Map());
  const [userActivities, setUserActivities] = useState<Map<string, string>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lastTrackRef = useRef<number>(0);
  const activityOverrideRef = useRef<string | null>(null);

  // Track user activity (mouse, keyboard, touch)
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Periodically update presence and check away status
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const statusMap = new Map<string, UserStatus>();
        const activityMap = new Map<string, string>();

        for (const [userId, presences] of Object.entries(state)) {
          if (presences && presences.length > 0) {
            const lastActive = new Date(presences[0].last_active).getTime();
            const isAway = Date.now() - lastActive > AWAY_TIMEOUT_MS;
            statusMap.set(userId, isAway ? 'away' : 'online');
            if (presences[0].current_activity) {
              activityMap.set(userId, presences[0].current_activity);
            }
          }
        }

        setOnlineUsers(statusMap);
        setUserActivities(activityMap);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            last_active: new Date().toISOString(),
            current_activity: activityOverrideRef.current || getActivityFromPath(location.pathname),
          });
        }
      });

    // Periodically update last_active to reflect activity + update last_seen in DB
    const activityInterval = setInterval(async () => {
      if (!channelRef.current) return;
      
      const now = Date.now();
      if (now - lastTrackRef.current < ACTIVITY_THROTTLE_MS) return;
      
      lastTrackRef.current = now;
      await channelRef.current.track({
        user_id: user.id,
        last_active: new Date(lastActivityRef.current).toISOString(),
        current_activity: activityOverrideRef.current || getActivityFromPath(location.pathname),
      });

      // Update last_seen in profiles for "recently online" feature
      supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("user_id", user.id)
        .then(() => {});
    }, ACTIVITY_THROTTLE_MS);

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      clearInterval(activityInterval);
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, handleActivity, location.pathname]);

  // Re-track when route changes
  useEffect(() => {
    if (!user || !channelRef.current) return;
    activityOverrideRef.current = null; // Reset override on route change
    channelRef.current.track({
      user_id: user.id,
      last_active: new Date().toISOString(),
      current_activity: getActivityFromPath(location.pathname),
    });
  }, [location.pathname, user]);

  const getUserStatus = useCallback(
    (userId: string): UserStatus => {
      return onlineUsers.get(userId) || 'offline';
    },
    [onlineUsers]
  );

  const getUserActivity = useCallback(
    (userId: string): string | undefined => {
      return userActivities.get(userId);
    },
    [userActivities]
  );

  /**
   * Override the activity label (e.g. when switching tabs on the main page).
   * Pass null to reset to route-based detection.
   */
  const setActivity = useCallback((activity: string | null) => {
    activityOverrideRef.current = activity;
    if (user && channelRef.current) {
      channelRef.current.track({
        user_id: user.id,
        last_active: new Date().toISOString(),
        current_activity: activity || getActivityFromPath(location.pathname),
      });
    }
  }, [user, location.pathname]);

  return {
    onlineUsers,
    getUserStatus,
    getUserActivity,
    setActivity,
  };
}

function getActivityFromPath(pathname: string): string {
  if (pathname.startsWith('/rum')) return 'Hänger i Rummet';
  if (pathname.startsWith('/profile')) return 'Kollar en profil';
  if (pathname === '/news' || pathname.startsWith('/news/')) return 'Läser nyheter';
  if (pathname === '/auth') return 'Loggar in';
  if (pathname === '/admin') return 'Administrerar';
  // Check hash/tab context from the main page
  return 'Surfar runt';
}
