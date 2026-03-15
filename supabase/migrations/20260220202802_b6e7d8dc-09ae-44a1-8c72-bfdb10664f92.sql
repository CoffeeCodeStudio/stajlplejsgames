-- Drop the restrictive DELETE policies and recreate as PERMISSIVE
-- so that EITHER the author OR the profile owner can delete

DROP POLICY "Authors can delete their own entries" ON public.profile_guestbook;
DROP POLICY "Profile owners can delete entries on their profile" ON public.profile_guestbook;
DROP POLICY "Admins can delete any profile_guestbook" ON public.profile_guestbook;

CREATE POLICY "Authors can delete their own entries"
ON public.profile_guestbook
FOR DELETE
USING (auth.uid() = author_id);

CREATE POLICY "Profile owners can delete entries on their profile"
ON public.profile_guestbook
FOR DELETE
USING (auth.uid() = profile_owner_id);

CREATE POLICY "Admins can delete any profile_guestbook"
ON public.profile_guestbook
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));