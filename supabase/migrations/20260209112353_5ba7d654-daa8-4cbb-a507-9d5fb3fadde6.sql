-- Add 'banned' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'banned';

-- Allow admins to delete guestbook entries (for moderation)
CREATE POLICY "Admins can delete any guestbook entry"
ON public.guestbook_entries
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any klotter (for moderation)
CREATE POLICY "Admins can delete any klotter"
ON public.klotter
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any profile
CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete messages for user cleanup
CREATE POLICY "Admins can delete any message"
ON public.messages
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete friend_votes
CREATE POLICY "Admins can delete any friend_votes"
ON public.friend_votes
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete friends
CREATE POLICY "Admins can delete any friendship"
ON public.friends
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete good_vibes
CREATE POLICY "Admins can delete any good_vibes"
ON public.good_vibes
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete good_vibe_allowances
CREATE POLICY "Admins can delete any allowance"
ON public.good_vibe_allowances
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete profile visits
CREATE POLICY "Admins can delete any profile_visits"
ON public.profile_visits
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete lajv messages
CREATE POLICY "Admins can delete any lajv_messages"
ON public.lajv_messages
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete profile guestbook entries
CREATE POLICY "Admins can delete any profile_guestbook"
ON public.profile_guestbook
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));