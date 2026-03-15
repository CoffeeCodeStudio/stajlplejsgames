-- Allow users to also delete chat messages they received (for "clear all" feature)
CREATE POLICY "Users can delete own received messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = recipient_id);