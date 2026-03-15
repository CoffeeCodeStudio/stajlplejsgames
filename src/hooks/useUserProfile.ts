import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfileData {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  gender: string;
  city: string;
  age: number | null;
}

/**
 * Global hook to get the current user's basic profile info.
 * Used across the app for consistent avatar/username display.
 */
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, avatar_url, gender, city, age')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data as UserProfileData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    refetch: fetchProfile,
  };
}
