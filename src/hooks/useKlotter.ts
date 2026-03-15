import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

export interface Klotter {
  id: string;
  user_id: string;
  image_url: string;
  comment: string | null;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  // Resolved signed URL for display
  signed_url?: string;
}

// Extract the storage path from a full public URL or return as-is if already a path
function extractStoragePath(imageUrl: string): string {
  // If it's already a relative path (no http), return as-is
  if (!imageUrl.startsWith('http')) return imageUrl;
  
  // Extract path after /object/public/klotter/
  const publicMatch = imageUrl.match(/\/object\/public\/klotter\/(.+)$/);
  if (publicMatch) return publicMatch[1];
  
  // Extract path after /object/sign/klotter/
  const signMatch = imageUrl.match(/\/object\/sign\/klotter\/(.+?)(\?|$)/);
  if (signMatch) return signMatch[1];
  
  // Fallback: return the URL as-is (legacy)
  return imageUrl;
}

/**
 * Manages the "Klotterplanket" (graffiti wall) feature.
 *
 * Loads all klotter entries with signed storage URLs (1 h expiry), and
 * provides helpers to upload a new drawing (data-URL → storage → DB row)
 * and delete owned entries (removes both DB row and storage file).
 *
 * @returns `klotter` array, `loading`, `uploadAndSaveKlotter`, `deleteKlotter`, `refetch`.
 */
export function useKlotter() {
  const [klotter, setKlotter] = useState<Klotter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile } = useProfile();

  // Generate signed URLs for klotter items
  const resolveSignedUrls = useCallback(async (items: Klotter[]): Promise<Klotter[]> => {
    if (items.length === 0) return items;

    const paths = items.map(item => extractStoragePath(item.image_url));
    
    const { data, error } = await supabase.storage
      .from('klotter')
      .createSignedUrls(paths, 3600); // 1 hour expiry

    if (error || !data) {
      console.error('Error creating signed URLs:', error);
      // Fallback: return items without signed URLs
      return items;
    }

    return items.map((item, index) => ({
      ...item,
      signed_url: data[index]?.signedUrl || item.image_url,
    }));
  }, []);

  const fetchKlotter = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('klotter')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const withSignedUrls = await resolveSignedUrls(data || []);
      setKlotter(withSignedUrls);
    } catch (error) {
      console.error('Error fetching klotter:', error);
    } finally {
      setLoading(false);
    }
  }, [resolveSignedUrls]);

  useEffect(() => {
    if (user) {
      fetchKlotter();
    } else {
      setKlotter([]);
      setLoading(false);
    }
  }, [user, fetchKlotter]);

  const uploadAndSaveKlotter = async (
    imageDataUrl: string,
    comment?: string
  ): Promise<boolean> => {
    if (!user || !profile) {
      toast.error('Du måste vara inloggad för att publicera');
      return false;
    }

    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Generate unique filename
      const filename = `${user.id}/${Date.now()}.png`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('klotter')
        .upload(filename, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Store the file path (not the public URL) in the database
      const { error: insertError } = await supabase
        .from('klotter')
        .insert({
          user_id: user.id,
          image_url: filename,
          comment: comment?.trim() || null,
          author_name: profile.username,
          author_avatar: profile.avatar_url
        });

      if (insertError) throw insertError;

      toast.success('Klotter publicerat! 🎨');
      await fetchKlotter();
      return true;
    } catch (error) {
      console.error('Error publishing klotter:', error);
      toast.error('Kunde inte publicera klottret');
      return false;
    }
  };

  const deleteKlotter = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Find the klotter item to get the storage path
      const item = klotter.find(k => k.id === id);
      
      // Delete from database first
      const { error } = await supabase
        .from('klotter')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Also delete the file from storage
      if (item) {
        const storagePath = extractStoragePath(item.image_url);
        await supabase.storage
          .from('klotter')
          .remove([storagePath]);
      }

      setKlotter(prev => prev.filter(k => k.id !== id));
      toast.success('Klotter borttaget');
      return true;
    } catch (error) {
      console.error('Error deleting klotter:', error);
      toast.error('Kunde inte ta bort klottret');
      return false;
    }
  };

  return {
    klotter,
    loading,
    uploadAndSaveKlotter,
    deleteKlotter,
    refetch: fetchKlotter
  };
}
