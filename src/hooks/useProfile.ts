import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  city: string;
  gender: string;
  age: number | null;
  occupation: string;
  relationship: string;
  personality: string;
  hair_color: string;
  body_type: string;
  clothing: string;
  likes: string;
  eats: string;
  listens_to: string;
  prefers: string;
  looking_for: string[];
  interests: string;
  spanar_in: string;
  status_message: string;
  created_at: string;
  updated_at: string;
  last_seen: string | null;
}

/**
 * Fetches and manages a user's profile from the `profiles` table.
 *
 * If no `userId` is supplied the hook defaults to the currently authenticated
 * user. When the profile does not yet exist for the current user it is
 * automatically created with a default username.
 *
 * @param userId - Optional user ID to load. Defaults to `auth.user.id`.
 * @returns An object with:
 *  - `profile` – The loaded {@link ProfileData}, or `null`.
 *  - `loading` / `saving` – Loading states.
 *  - `isOwnProfile` – Whether the loaded profile belongs to the current user.
 *  - `updateProfile` – Persist partial profile changes.
 *  - `refetch` – Re-fetch the profile from the database.
 */
export function useProfile(userId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const targetUserId = userId || user?.id;

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one if it's the current user
          if (user && targetUserId === user.id) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                user_id: user.id,
                username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
              })
              .select()
              .single();

            if (createError) throw createError;
            setProfile(newProfile as ProfileData);
          }
        } else {
          throw error;
        }
      } else {
        setProfile(data as ProfileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Fel vid hämtning av profil',
        description: 'Kunde inte hämta profildata',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [targetUserId, user, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (!user || !profile) return { error: new Error('No user or profile') };

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data as ProfileData);
      toast({
        title: 'Profil sparad!',
        description: 'Dina ändringar har sparats.',
      });
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Fel vid sparande',
        description: 'Kunde inte spara profiländringar',
        variant: 'destructive',
      });
      return { data: null, error };
    } finally {
      setSaving(false);
    }
  };

  const isOwnProfile = user?.id === targetUserId;

  return {
    profile,
    loading,
    saving,
    isOwnProfile,
    updateProfile,
    refetch: fetchProfile,
  };
}
