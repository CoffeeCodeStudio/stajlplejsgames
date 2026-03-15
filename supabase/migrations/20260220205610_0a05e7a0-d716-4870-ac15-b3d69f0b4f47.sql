
-- Drop all existing restrictive DELETE policies on profile_guestbook
DROP POLICY IF EXISTS "Admins can delete any profile_guestbook" ON public.profile_guestbook;
DROP POLICY IF EXISTS "Authors can delete their own entries" ON public.profile_guestbook;
DROP POLICY IF EXISTS "Profile owners can delete entries on their profile" ON public.profile_guestbook;

-- Recreate as PERMISSIVE (OR logic) so any ONE matching policy allows the delete
CREATE POLICY "Admins can delete any profile_guestbook"
  ON public.profile_guestbook FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authors can delete their own entries"
  ON public.profile_guestbook FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Profile owners can delete entries on their profile"
  ON public.profile_guestbook FOR DELETE
  USING (auth.uid() = profile_owner_id);
