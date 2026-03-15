import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Visitor {
  id: string;
  username: string;
  avatar_url: string | null;
  visited_at: string;
}

/**
 * Tracks and displays profile visitors.
 *
 * Automatically logs a visit when the current user views another user's
 * profile (uses upsert to prevent duplicates). Returns the 5 most recent
 * visitors with their profile info.
 *
 * @param profileOwnerId - The `user_id` whose visitors to track/display.
 * @returns `visitors` array, `loading` flag, and `refetch` callback.
 */
export function useProfileVisits(profileOwnerId: string | undefined) {
  const { user } = useAuth();
  const effectiveOwnerId = profileOwnerId || user?.id;
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  // Log visit when viewing someone else's profile
  const logVisit = useCallback(async () => {
    if (!user || !effectiveOwnerId || user.id === effectiveOwnerId) return;

    try {
      // Upsert: insert or update if already visited
      const { error } = await supabase
        .from('profile_visits')
        .upsert(
          {
            profile_owner_id: effectiveOwnerId,
            visitor_id: user.id,
            visited_at: new Date().toISOString(),
          },
          { onConflict: 'profile_owner_id,visitor_id' }
        );

      if (error) {
        console.error('Error logging visit:', error);
      }
    } catch (err) {
      console.error('Error logging visit:', err);
    }
  }, [user, effectiveOwnerId]);

  // Fetch visitors for a profile
  const fetchVisitors = useCallback(async () => {
    if (!effectiveOwnerId) {
      setVisitors([]);
      setLoading(false);
      return;
    }

    try {
      // Get visit records
      const { data: visitData, error: visitError } = await supabase
        .from('profile_visits')
        .select('id, visitor_id, visited_at')
        .eq('profile_owner_id', effectiveOwnerId)
        .order('visited_at', { ascending: false })
        .limit(5);

      if (visitError) {
        console.error('Error fetching visits:', visitError);
        setVisitors([]);
        setLoading(false);
        return;
      }

      if (!visitData || visitData.length === 0) {
        setVisitors([]);
        setLoading(false);
        return;
      }

      // Get profile info for each visitor
      const visitorIds = visitData.map((v) => v.visitor_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', visitorIds);

      if (profileError) {
        console.error('Error fetching visitor profiles:', profileError);
        setVisitors([]);
        setLoading(false);
        return;
      }

      // Merge visit and profile data
      const enrichedVisitors: Visitor[] = visitData.map((visit) => {
        const profile = profileData?.find((p) => p.user_id === visit.visitor_id);
        return {
          id: visit.id,
          username: profile?.username || 'Okänd',
          avatar_url: profile?.avatar_url || null,
          visited_at: visit.visited_at,
        };
      });

      setVisitors(enrichedVisitors);
    } catch (err) {
      console.error('Error in fetchVisitors:', err);
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveOwnerId]);

  // Log visit on mount (when viewing other's profile)
  useEffect(() => {
    logVisit();
  }, [logVisit]);

  // Fetch visitors
  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  return { visitors, loading, refetch: fetchVisitors };
}
