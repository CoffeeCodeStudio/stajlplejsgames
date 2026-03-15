-- Fix: Restrict lajv_messages read access to authenticated users only
-- This prevents anonymous scraping of user IDs and message content

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read lajv messages" ON public.lajv_messages;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can read lajv messages"
ON public.lajv_messages
FOR SELECT
USING (auth.uid() IS NOT NULL);