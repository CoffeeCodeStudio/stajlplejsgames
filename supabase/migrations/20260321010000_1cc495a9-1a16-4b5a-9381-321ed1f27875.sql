-- Anti-cheat session tracking for Snake (mirrors memory_sessions/memory_events)
CREATE TABLE public.snake_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  username text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  is_valid boolean NOT NULL DEFAULT true,
  score integer,
  apples_eaten integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.snake_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.snake_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'apple_eaten'
  event_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_snake_events_session ON public.snake_events(session_id);
CREATE INDEX idx_snake_sessions_token ON public.snake_sessions(session_token);

ALTER TABLE public.snake_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snake_events ENABLE ROW LEVEL SECURITY;

-- Sessions/events: only the edge function (service role) may read or write
CREATE POLICY "Service role manages snake sessions" ON public.snake_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages snake events" ON public.snake_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Lock down snake_highscores: remove the open anon INSERT policy
DROP POLICY IF EXISTS "Anyone can insert snake highscores" ON public.snake_highscores;

-- Only the edge function (service role), after anti-cheat validation, may insert highscores
CREATE POLICY "Service role inserts snake highscores" ON public.snake_highscores
  FOR INSERT TO service_role WITH CHECK (true);
