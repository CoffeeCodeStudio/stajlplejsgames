import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const VOTE_CATEGORIES = [
  'Bäst', 'Nörd', 'Cooling', 'Hård som sten', 'Festis', 'Ball', 'Tuffing',
] as const;

export type VoteCategory = (typeof VOTE_CATEGORIES)[number];

export interface VoteCounts {
  [category: string]: number;
}

export interface UserVotes {
  [category: string]: boolean;
}

/**
 * Manages "friend vote" categories (e.g. Bäst, Nörd, Cooling) for a target user.
 *
 * Fetches aggregated vote counts and the current user's own votes, and
 * provides a `toggleVote` action that optimistically updates the UI with
 * automatic re-sync on error.
 *
 * @param targetUserId - The user whose votes to load.
 * @returns Vote counts, user votes, total, toggle callback, and loading state.
 */
export function useFriendVotes(targetUserId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchVotes = useCallback(async () => {
    if (!targetUserId) return;

    try {
      // Fetch all votes for this user
      const { data: allVotes, error } = await supabase
        .from('friend_votes')
        .select('vote_category, voter_id')
        .eq('target_user_id', targetUserId);

      if (error) throw error;

      const counts: VoteCounts = {};
      const myVotes: UserVotes = {};
      let total = 0;

      VOTE_CATEGORIES.forEach((cat) => {
        counts[cat] = 0;
      });

      allVotes?.forEach((vote) => {
        counts[vote.vote_category] = (counts[vote.vote_category] || 0) + 1;
        total++;
        if (user && vote.voter_id === user.id) {
          myVotes[vote.vote_category] = true;
        }
      });

      setVoteCounts(counts);
      setUserVotes(myVotes);
      setTotalVotes(total);
    } catch (err) {
      console.error('Error fetching friend votes:', err);
    }
  }, [targetUserId, user]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const toggleVote = async (category: VoteCategory) => {
    if (!user || !targetUserId) return;

    setLoading(true);
    try {
      if (userVotes[category]) {
        // Remove vote
        const { error } = await supabase
          .from('friend_votes')
          .delete()
          .eq('voter_id', user.id)
          .eq('target_user_id', targetUserId)
          .eq('vote_category', category);

        if (error) throw error;

        setUserVotes((prev) => ({ ...prev, [category]: false }));
        setVoteCounts((prev) => ({ ...prev, [category]: Math.max(0, (prev[category] || 0) - 1) }));
        setTotalVotes((prev) => Math.max(0, prev - 1));
      } else {
        // Add vote
        const { error } = await supabase
          .from('friend_votes')
          .insert({
            voter_id: user.id,
            target_user_id: targetUserId,
            vote_category: category,
          });

        if (error) throw error;

        setUserVotes((prev) => ({ ...prev, [category]: true }));
        setVoteCounts((prev) => ({ ...prev, [category]: (prev[category] || 0) + 1 }));
        setTotalVotes((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling vote:', err);
      toast({
        title: 'Kunde inte rösta',
        description: 'Försök igen senare.',
        variant: 'destructive',
      });
      fetchVotes(); // Re-sync on error
    } finally {
      setLoading(false);
    }
  };

  return { voteCounts, userVotes, totalVotes, toggleVote, loading, refetch: fetchVotes };
}
