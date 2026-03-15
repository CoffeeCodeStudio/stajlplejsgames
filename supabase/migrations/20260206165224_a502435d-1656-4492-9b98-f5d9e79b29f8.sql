
-- 1. Add category column to friends table
ALTER TABLE public.friends 
ADD COLUMN category text NOT NULL DEFAULT 'Nätvän';

-- 2. Create friend_votes table for personality meters
CREATE TABLE public.friend_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  vote_category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_vote_per_category UNIQUE (voter_id, target_user_id, vote_category),
  CONSTRAINT valid_vote_category CHECK (vote_category IN ('Bäst', 'Nörd', 'Cooling', 'Hård som sten', 'Festis', 'Ball', 'Tuffing'))
);

-- Enable RLS on friend_votes
ALTER TABLE public.friend_votes ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users can read all votes (needed for % calculation)
CREATE POLICY "Authenticated users can read friend votes"
ON public.friend_votes FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS: Users can insert their own votes
CREATE POLICY "Users can vote for friends"
ON public.friend_votes FOR INSERT
WITH CHECK (auth.uid() = voter_id);

-- RLS: Users can delete their own votes
CREATE POLICY "Users can remove their own votes"
ON public.friend_votes FOR DELETE
USING (auth.uid() = voter_id);

-- 3. Modify handle_new_user to also add BotAdam as friend
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_botadam_id uuid;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (
    user_id, 
    username,
    bio, city, gender, occupation, relationship, personality,
    hair_color, body_type, clothing, likes, eats, listens_to,
    prefers, interests, spanar_in, status_message, looking_for
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '{}'::text[]
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Auto-friend with BotAdam (looked up dynamically, not hardcoded)
  SELECT user_id INTO v_botadam_id
  FROM public.profiles
  WHERE username = 'BotAdam'
  LIMIT 1;

  IF v_botadam_id IS NOT NULL AND v_botadam_id != NEW.id THEN
    INSERT INTO public.friends (user_id, friend_id, status, category)
    VALUES (v_botadam_id, NEW.id, 'accepted', 'Nätvän')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Enable realtime for friend_votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_votes;
