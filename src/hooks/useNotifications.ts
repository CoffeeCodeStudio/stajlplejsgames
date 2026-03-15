import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NotificationCounts {
  unreadMail: number;
  pendingFriends: number;
  guestbookNew: number;
  lajvActive: number;
  newVisitors: number;
}

const VISITORS_LAST_CHECKED_KEY = 'echo2000_visitors_last_checked';

/**
 * Hook to track notification counts for intelligent navbar.
 * Icons will animate/glow when there are new notifications.
 *
 * Exposes `markGuestbookRead()` and `markVisitorsRead()` to zero counters.
 */
export function useNotifications() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMail: 0,
    pendingFriends: 0,
    guestbookNew: 0,
    lajvActive: 0,
    newVisitors: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!user) {
      setCounts({ unreadMail: 0, pendingFriends: 0, guestbookNew: 0, lajvActive: 0, newVisitors: 0 });
      setLoading(false);
      return;
    }

    try {
      // Fetch unread mail count
      const { count: mailCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)
        .eq('deleted_by_recipient', false);

      // Fetch pending friend requests
      const { count: friendCount } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      // Fetch active lajv messages
      const { count: lajvCount } = await supabase
        .from('lajv_messages')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString());

      // Guestbook: count unread entries on the current user's profile
      const { count: gbCount } = await supabase
        .from('profile_guestbook')
        .select('*', { count: 'exact', head: true })
        .eq('profile_owner_id', user.id)
        .eq('is_read', false);

      // New visitors since last check
      const lastChecked = localStorage.getItem(VISITORS_LAST_CHECKED_KEY) || '1970-01-01T00:00:00Z';
      const { count: visitorCount } = await supabase
        .from('profile_visits')
        .select('*', { count: 'exact', head: true })
        .eq('profile_owner_id', user.id)
        .gt('visited_at', lastChecked);

      setCounts({
        unreadMail: mailCount || 0,
        pendingFriends: friendCount || 0,
        guestbookNew: gbCount || 0,
        lajvActive: lajvCount || 0,
        newVisitors: visitorCount || 0,
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Mark all guestbook entries on the user's profile as read.
   */
  const markGuestbookRead = useCallback(async () => {
    if (!user) return;
    setCounts((prev) => ({ ...prev, guestbookNew: 0 }));
    try {
      await supabase
        .from('profile_guestbook')
        .update({ is_read: true } as any)
        .eq('profile_owner_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking guestbook as read:', error);
      fetchCounts();
    }
  }, [user, fetchCounts]);

  /**
   * Mark visitors as "seen" by storing current timestamp in localStorage.
   */
  const markVisitorsRead = useCallback(() => {
    localStorage.setItem(VISITORS_LAST_CHECKED_KEY, new Date().toISOString());
    setCounts((prev) => ({ ...prev, newVisitors: 0 }));
  }, []);

  useEffect(() => {
    fetchCounts();
    if (!user) return;

    const messagesChannel = supabase
      .channel('notifications-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchCounts)
      .subscribe();

    const friendsChannel = supabase
      .channel('notifications-friends')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchCounts)
      .subscribe();

    const lajvChannel = supabase
      .channel('notifications-lajv')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lajv_messages' }, fetchCounts)
      .subscribe();

    const guestbookChannel = supabase
      .channel('notifications-profile-guestbook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_guestbook' }, fetchCounts)
      .subscribe();

    const visitorChannel = supabase
      .channel('notifications-visitors')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profile_visits' }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(friendsChannel);
      supabase.removeChannel(lajvChannel);
      supabase.removeChannel(guestbookChannel);
      supabase.removeChannel(visitorChannel);
    };
  }, [user, fetchCounts]);

  return {
    counts,
    loading,
    refetch: fetchCounts,
    markGuestbookRead,
    markVisitorsRead,
  };
}
