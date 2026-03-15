-- Fix PUBLIC_DATA_EXPOSURE: Restrict guestbook read access to authenticated users only
-- This prevents unauthenticated scraping while maintaining community feature for logged-in members

DROP POLICY IF EXISTS "Anyone can read guestbook entries" ON guestbook_entries;

CREATE POLICY "Authenticated users can read guestbook entries" 
ON guestbook_entries 
FOR SELECT 
USING (auth.uid() IS NOT NULL);