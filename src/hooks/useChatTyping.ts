import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Listens for typing indicator broadcasts on a chat channel.
 * Returns the user_id of whoever is currently typing, or null.
 */
export function useChatTyping(userId: string | undefined, contactId: string | null) {
  const [typingUserId, setTypingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !contactId) return;

    const channelName = `chat-typing-${[userId, contactId].sort().join('-')}`;

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload as { user_id: string; typing: boolean };
        if (data.user_id === contactId) {
          setTypingUserId(data.typing ? data.user_id : null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, contactId]);

  return typingUserId;
}
