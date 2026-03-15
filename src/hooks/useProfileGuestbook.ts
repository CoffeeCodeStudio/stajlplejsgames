import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface GuestbookEntry {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  message: string;
  created_at: string;
}

/**
 * CRUD operations for a user's profile guestbook.
 *
 * Loads the latest 50 entries for the given profile owner, supports posting
 * (with 500-char validation), replying to another user's guestbook, and
 * optimistic delete / clear-all with automatic rollback on failure.
 *
 * @param profileOwnerId - The `user_id` of the profile whose guestbook to manage.
 * @returns Entries array, loading/posting states, and action callbacks.
 */
export function useProfileGuestbook(profileOwnerId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!profileOwnerId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profile_guestbook')
        .select('*')
        .eq('profile_owner_id', profileOwnerId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching guestbook:', error);
        setEntries([]);
      } else {
        setEntries(data || []);
      }
    } catch (err) {
      console.error('Error in fetchEntries:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [profileOwnerId]);

  const postEntry = useCallback(
    async (message: string) => {
      if (!user || !profileOwnerId || !message.trim()) return false;

      // Input validation
      const trimmedMessage = message.trim();
      if (trimmedMessage.length > 500) {
        toast({
          title: 'Meddelandet är för långt',
          description: 'Max 500 tecken',
          variant: 'destructive',
        });
        return false;
      }

      setPosting(true);
      try {
        // Get current user's profile for author info
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        }

        const { error } = await supabase.from('profile_guestbook').insert({
          profile_owner_id: profileOwnerId,
          author_id: user.id,
          author_name: profileData?.username || 'Anonym',
          author_avatar: profileData?.avatar_url || null,
          message: trimmedMessage,
        });

        if (error) {
          console.error('Error posting to guestbook:', error);
          toast({
            title: 'Kunde inte skicka',
            description: 'Försök igen senare',
            variant: 'destructive',
          });
          return false;
        }

        toast({
          title: 'Inlägg skickat!',
          description: 'Ditt meddelande har lagts till i gästboken',
        });

        await fetchEntries();
        return true;
      } catch (err) {
        console.error('Error in postEntry:', err);
        toast({
          title: 'Ett fel uppstod',
          description: 'Försök igen senare',
          variant: 'destructive',
        });
        return false;
      } finally {
        setPosting(false);
      }
    },
    [user, profileOwnerId, fetchEntries, toast]
  );

  // Post an entry to a DIFFERENT user's guestbook (for reply feature)
  const postEntryTo = useCallback(
    async (targetOwnerId: string, message: string) => {
      if (!user || !message.trim()) return false;

      const trimmedMessage = message.trim();
      if (trimmedMessage.length > 500) {
        toast({ title: 'Meddelandet är för långt', description: 'Max 500 tecken', variant: 'destructive' });
        return false;
      }

      setPosting(true);
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        const { error } = await supabase.from('profile_guestbook').insert({
          profile_owner_id: targetOwnerId,
          author_id: user.id,
          author_name: profileData?.username || 'Anonym',
          author_avatar: profileData?.avatar_url || null,
          message: trimmedMessage,
        });

        if (error) {
          toast({ title: 'Kunde inte skicka', description: 'Försök igen senare', variant: 'destructive' });
          return false;
        }

        toast({ title: 'Svar skickat!', description: 'Ditt svar har lagts till i mottagarens gästbok' });
        // If the target is the same profile we're viewing, refetch
        if (targetOwnerId === profileOwnerId) {
          await fetchEntries();
        }
        return true;
      } catch {
        toast({ title: 'Ett fel uppstod', description: 'Försök igen senare', variant: 'destructive' });
        return false;
      } finally {
        setPosting(false);
      }
    },
    [user, profileOwnerId, fetchEntries, toast]
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      if (!user) return false;

      // Optimistic: remove from UI immediately
      setEntries((prev) => prev.filter((e) => e.id !== entryId));

      try {
        const { error } = await supabase
          .from('profile_guestbook')
          .delete()
          .eq('id', entryId);

        if (error) {
          console.error('Error deleting entry:', error);
          toast({
            title: 'Kunde inte radera',
            description: 'Försök igen senare',
            variant: 'destructive',
          });
          // Rollback: refetch on failure
          await fetchEntries();
          return false;
        }

        return true;
      } catch (err) {
        console.error('Error in deleteEntry:', err);
        await fetchEntries();
        return false;
      }
    },
    [user, fetchEntries, toast]
  );

  const clearAll = useCallback(
    async () => {
      if (!user || !profileOwnerId) return false;

      // Optimistic: clear UI immediately
      const snapshot = entries;
      setEntries([]);

      try {
        const { error } = await supabase
          .from('profile_guestbook')
          .delete()
          .eq('profile_owner_id', profileOwnerId);

        if (error) {
          console.error('Error clearing guestbook:', error);
          setEntries(snapshot); // Rollback
          return false;
        }

        return true;
      } catch (err) {
        console.error('Error in clearAll:', err);
        setEntries(snapshot); // Rollback
        return false;
      }
    },
    [user, profileOwnerId, entries]
  );

  useEffect(() => {
    fetchEntries();

    if (!profileOwnerId) return;

    // Subscribe to realtime changes for this profile's guestbook
    const channel = supabase
      .channel(`guestbook:${profileOwnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_guestbook',
          filter: `profile_owner_id=eq.${profileOwnerId}`,
        },
        () => {
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEntries, profileOwnerId]);

  return {
    entries,
    loading,
    posting,
    postEntry,
    postEntryTo,
    deleteEntry,
    clearAll,
    refetch: fetchEntries,
  };
}
