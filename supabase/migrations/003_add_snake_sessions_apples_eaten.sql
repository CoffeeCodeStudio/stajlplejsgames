-- snake_sessions records the final score of a run but not how many apples
-- produced it, so a session row can't be sanity-checked against its own
-- event log without re-querying snake_events. snake_highscores already
-- stores apples_eaten; this mirrors it on the session.
--
-- Nullable with no default: existing rows predate the counter and their
-- true value is unknown, so they stay NULL rather than claiming 0 apples.
ALTER TABLE public.snake_sessions ADD COLUMN IF NOT EXISTS apples_eaten integer;
