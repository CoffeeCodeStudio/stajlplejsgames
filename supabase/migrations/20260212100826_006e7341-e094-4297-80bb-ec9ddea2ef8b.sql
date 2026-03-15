
-- Create chat_messages table for persistent messenger
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages they sent or received
CREATE POLICY "Users can read own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages (insert with their own sender_id)
CREATE POLICY "Users can send chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update read status on messages they received
CREATE POLICY "Users can mark received messages as read"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Users can delete their own sent messages
CREATE POLICY "Users can delete own sent messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Admins can delete any chat message
CREATE POLICY "Admins can delete any chat message"
  ON public.chat_messages FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Index for fast lookups
CREATE INDEX idx_chat_messages_participants ON public.chat_messages (sender_id, recipient_id, created_at);
CREATE INDEX idx_chat_messages_recipient ON public.chat_messages (recipient_id, is_read);
