import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

/**
 * Real-time chat message manager for a 1-on-1 conversation.
 *
 * Fetches the message history between the current user and `contactId`,
 * subscribes to new inserts via Supabase Realtime, and auto-marks incoming
 * messages as read.
 *
 * @param contactId - The other user's ID, or `null` if no conversation is selected.
 * @returns `messages`, `loading`, and a `sendMessage` callback.
 */
export function useChatMessages(contactId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch messages for the conversation
  useEffect(() => {
    if (!user || !contactId) {
      setMessages([]);
      return;
    }

    setLoading(true);

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat messages:', error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Mark unread messages as read
    supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('sender_id', contactId)
      .eq('recipient_id', user.id)
      .eq('is_read', false)
      .then();

    // Subscribe to realtime
    const channel = supabase
      .channel(`chat-${[user.id, contactId].sort().join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          // Only add if it's part of this conversation
          if (
            (msg.sender_id === user.id && msg.recipient_id === contactId) ||
            (msg.sender_id === contactId && msg.recipient_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });

            // Auto-mark as read if we're the recipient
            if (msg.recipient_id === user.id) {
              supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('id', msg.id)
                .then();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, contactId]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!user || !contactId || !content.trim()) return false;

      const { error } = await supabase.from('chat_messages').insert({
        sender_id: user.id,
        recipient_id: contactId,
        content: content.trim(),
      });

      if (error) {
        console.error('Error sending chat message:', error);
        return false;
      }
      return true;
    },
    [user, contactId]
  );

  return { messages, loading, sendMessage };
}
