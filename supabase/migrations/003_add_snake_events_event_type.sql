-- snake_events was missing the event_type column that
-- supabase/functions/snake-game/index.ts writes/reads on every apple
-- pickup and on finish. Every insert silently failed (error not checked),
-- so finish always saw zero apple events and saved score 0 regardless of
-- how many apples the player actually ate.
ALTER TABLE public.snake_events ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'apple';
