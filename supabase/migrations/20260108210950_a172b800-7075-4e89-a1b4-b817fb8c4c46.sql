-- Create lajv_messages table for real-time messages
CREATE TABLE public.lajv_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    username TEXT NOT NULL DEFAULT 'Anonym',
    avatar_url TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable Row Level Security
ALTER TABLE public.lajv_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read lajv messages (public feature)
CREATE POLICY "Anyone can read lajv messages" 
ON public.lajv_messages 
FOR SELECT 
USING (true);

-- Authenticated users can insert their own messages
CREATE POLICY "Authenticated users can insert lajv messages" 
ON public.lajv_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own lajv messages" 
ON public.lajv_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for lajv_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.lajv_messages;

-- Create function to auto-delete expired messages
CREATE OR REPLACE FUNCTION public.delete_expired_lajv_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.lajv_messages WHERE expires_at < now();
END;
$$;

-- Create index for faster expiration queries
CREATE INDEX idx_lajv_messages_expires_at ON public.lajv_messages(expires_at);