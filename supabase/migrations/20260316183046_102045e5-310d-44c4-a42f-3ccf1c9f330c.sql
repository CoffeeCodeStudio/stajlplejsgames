
-- Session table for anti-cheat tracking
CREATE TABLE public.memory_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  username text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  pairs integer NOT NULL DEFAULT 8,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  is_valid boolean NOT NULL DEFAULT true,
  score integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Event log for each game action
CREATE TABLE public.memory_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.memory_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'pair_found', 'mismatch'
  card_a_id integer,
  card_b_id integer,
  event_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_memory_events_session ON public.memory_events(session_id);
CREATE INDEX idx_memory_sessions_token ON public.memory_sessions(session_token);

-- Enable RLS
ALTER TABLE public.memory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_events ENABLE ROW LEVEL SECURITY;

-- Sessions: only service role can write (edge function), anon can read own via token
CREATE POLICY "Service role manages sessions" ON public.memory_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Events: only service role can write
CREATE POLICY "Service role manages events" ON public.memory_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Lock down memory_highscores: remove anon INSERT policy, keep SELECT
DROP POLICY IF EXISTS "Anyone can insert memory highscores" ON public.memory_highscores;
DROP POLICY IF EXISTS "Users can insert own memory highscores" ON public.memory_highscores;

-- Only service role (edge function) can insert highscores now
CREATE POLICY "Service role inserts highscores" ON public.memory_highscores
  FOR INSERT TO service_role WITH CHECK (true);
