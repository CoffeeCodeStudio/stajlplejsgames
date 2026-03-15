-- =============================================
-- FAS 2: Skapa alla nya databastabeller
-- =============================================

-- 1. FRIENDS TABLE - Vänner-system
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  is_best_friend BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Friends RLS policies
CREATE POLICY "Users can view their own friendships"
ON public.friends FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
ON public.friends FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
ON public.friends FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friend requests"
ON public.friends FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_friends_updated_at
BEFORE UPDATE ON public.friends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. MESSAGES TABLE - Mejl-system
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  subject TEXT NOT NULL CHECK (char_length(subject) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) <= 5000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  deleted_by_sender BOOLEAN NOT NULL DEFAULT false,
  deleted_by_recipient BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages RLS policies
CREATE POLICY "Users can view messages they sent or received"
ON public.messages FOR SELECT
USING (
  (auth.uid() = sender_id AND deleted_by_sender = false) OR 
  (auth.uid() = recipient_id AND deleted_by_recipient = false)
);

CREATE POLICY "Authenticated users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 3. PROFILE_GUESTBOOK TABLE - Gästbok på andras profiler
CREATE TABLE public.profile_guestbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_owner_id UUID NOT NULL,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_guestbook ENABLE ROW LEVEL SECURITY;

-- Profile Guestbook RLS policies
CREATE POLICY "Anyone authenticated can read profile guestbook"
ON public.profile_guestbook FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can write in guestbooks"
ON public.profile_guestbook FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own entries"
ON public.profile_guestbook FOR DELETE
USING (auth.uid() = author_id);

CREATE POLICY "Profile owners can delete entries on their profile"
ON public.profile_guestbook FOR DELETE
USING (auth.uid() = profile_owner_id);

-- Enable realtime for messages (for notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;