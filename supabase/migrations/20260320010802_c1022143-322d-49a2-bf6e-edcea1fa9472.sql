
-- First, remove any existing duplicates keeping only the earliest entry per (lobby_id, user_id)
DELETE FROM public.scribble_players
WHERE id NOT IN (
  SELECT DISTINCT ON (lobby_id, user_id) id
  FROM public.scribble_players
  ORDER BY lobby_id, user_id, joined_at ASC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.scribble_players
ADD CONSTRAINT scribble_players_lobby_user_unique UNIQUE (lobby_id, user_id);
