import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LajvMessage {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message: string;
  created_at: string;
  expires_at: string;
}

interface LajvContextType {
  messages: LajvMessage[];
  sendMessage: (message: string) => Promise<boolean>;
  sending: boolean;
}

const LajvContext = createContext<LajvContextType | undefined>(undefined);

export function LajvProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LajvMessage[]>([]);
  const [sending, setSending] = useState(false);

  // Fetch initial messages and set up realtime subscription
  useEffect(() => {
    const fetchMessages = async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('lajv_messages')
        .select('*')
        .gt('expires_at', now)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching lajv messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('global-lajv-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lajv_messages',
        },
        (payload) => {
          const newMsg = payload.new as LajvMessage;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'lajv_messages',
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    // Clean up expired messages locally every 30 seconds
    const cleanupInterval = setInterval(() => {
      const now = new Date().toISOString();
      setMessages((prev) => prev.filter((msg) => msg.expires_at > now));
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, []);

  const sendMessage = useCallback(async (message: string): Promise<boolean> => {
    if (!message.trim()) return false;

    setSending(true);
    
    // Get profile username if logged in
    let username = 'Gäst';
    let avatarUrl: string | null = null;
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile?.username && !profile.username.startsWith('user_')) {
        username = profile.username;
      } else if (user.email) {
        username = user.email.split('@')[0];
      }
      avatarUrl = profile?.avatar_url || null;
    }
    
    const oderId = user?.id || crypto.randomUUID();

    const { data, error } = await supabase.from('lajv_messages').insert({
      user_id: oderId,
      username,
      avatar_url: avatarUrl,
      message: message.trim(),
    }).select().single();

    if (error) {
      console.error('Error sending lajv message:', error);
      setSending(false);
      return false;
    }

    // Immediately add to local state
    if (data) {
      setMessages((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data as LajvMessage];
      });
    }

    setSending(false);
    return true;
  }, [user]);

  return (
    <LajvContext.Provider value={{ messages, sendMessage, sending }}>
      {children}
    </LajvContext.Provider>
  );
}

export function useLajv() {
  const context = useContext(LajvContext);
  if (context === undefined) {
    throw new Error('useLajv must be used within a LajvProvider');
  }
  return context;
}
