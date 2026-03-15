import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'loading';

/**
 * Manages the friendship relationship between the current user and a target user.
 *
 * Tracks whether a friend request is pending, accepted, or non-existent and
 * provides actions to send, accept, or remove friend requests.
 *
 * @param targetUserId - The user ID of the potential friend.
 * @returns Friendship status, loading flag, and action callbacks.
 */
export function useFriendship(targetUserId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<FriendshipStatus>('loading');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch current friendship status
  const fetchStatus = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) {
      setStatus('none');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('friends')
        .select('id, user_id, friend_id, status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (error) {
        console.error('Error fetching friendship:', error);
        setStatus('none');
        return;
      }

      if (!data) {
        setStatus('none');
        setFriendshipId(null);
      } else {
        setFriendshipId(data.id);
        if (data.status === 'accepted') {
          setStatus('accepted');
        } else if (data.status === 'pending') {
          // Check who sent the request
          if (data.user_id === user.id) {
            setStatus('pending_sent');
          } else {
            setStatus('pending_received');
          }
        } else {
          setStatus('none');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setStatus('none');
    }
  }, [user, targetUserId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Send friend request
  const sendRequest = async () => {
    if (!user || !targetUserId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: targetUserId,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Vänförfrågan finns redan",
            description: "Du har redan skickat en förfrågan till denna person.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setStatus('pending_sent');
        toast({
          title: "Vänförfrågan skickad! 💌",
          description: "Din förfrågan har skickats.",
        });
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      toast({
        title: "Kunde inte skicka förfrågan",
        description: "Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Accept friend request
  const acceptRequest = async () => {
    if (!friendshipId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      setStatus('accepted');
      toast({
        title: "Ny vän! 🎉",
        description: "Ni är nu vänner!",
      });
    } catch (err) {
      console.error('Error accepting friend request:', err);
      toast({
        title: "Kunde inte acceptera förfrågan",
        description: "Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancel/decline/remove friend
  const removeFriendship = async () => {
    if (!friendshipId && status === 'pending_sent') {
      // Need to find the friendship ID first
      if (!user || !targetUserId) return;
      
      setLoading(true);
      try {
        const { error } = await supabase
          .from('friends')
          .delete()
          .eq('user_id', user.id)
          .eq('friend_id', targetUserId);

        if (error) throw error;

        setStatus('none');
        setFriendshipId(null);
        toast({
          title: "Förfrågan avbruten",
          description: "Vänförfrågan har tagits bort.",
        });
      } catch (err) {
        console.error('Error removing friendship:', err);
        toast({
          title: "Kunde inte ta bort förfrågan",
          description: "Försök igen senare.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!friendshipId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      setStatus('none');
      setFriendshipId(null);
      toast({
        title: "Vänskap borttagen",
        description: "Ni är inte längre vänner.",
      });
    } catch (err) {
      console.error('Error removing friendship:', err);
      toast({
        title: "Kunde inte ta bort vänskap",
        description: "Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    sendRequest,
    acceptRequest,
    removeFriendship,
    refetch: fetchStatus,
  };
}
