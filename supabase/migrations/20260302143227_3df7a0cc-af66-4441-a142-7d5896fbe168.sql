-- Add is_read column to profile_guestbook
ALTER TABLE public.profile_guestbook
ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Allow profile owners to update entries on their profile (to mark as read)
CREATE POLICY "Profile owners can update entries on their profile"
ON public.profile_guestbook
FOR UPDATE
USING (auth.uid() = profile_owner_id)
WITH CHECK (auth.uid() = profile_owner_id);