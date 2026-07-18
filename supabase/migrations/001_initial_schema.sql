-- =============================================
-- StajlPlejs Games — Clean Schema
-- Kör detta i Supabase SQL Editor
-- =============================================
--
-- NOTE: this is a squashed snapshot of the original ~53 incremental
-- migrations, applied wholesale to a fresh Supabase project after the
-- previous project got banned. The squash reintroduced open `TO anon`
-- write policies on the snake_*/memory_* anti-cheat tables and highscore
-- tables below — those are intentionally locked back down to
-- service_role-only by 002_lock_down_snake_rls.sql, which must run after
-- this file. Don't "fix" the policies here; fix them there, so the intent
-- (what changed and why) stays visible in migration history.

-- Snake Sessions (server-side score validation)
CREATE TABLE public.snake_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  username text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  is_valid boolean NOT NULL DEFAULT true,
  score integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_snake_sessions_token ON public.snake_sessions(session_token);
ALTER TABLE public.snake_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage snake sessions" ON public.snake_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Snake Events
CREATE TABLE public.snake_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.snake_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_snake_events_session ON public.snake_events(session_id);
ALTER TABLE public.snake_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage snake events" ON public.snake_events FOR ALL TO anon USING (true) WITH CHECK (true);

-- Snake Highscores
CREATE TABLE public.snake_highscores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  score INTEGER NOT NULL,
  apples_eaten INTEGER NOT NULL DEFAULT 0,
  time_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.snake_highscores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read snake highscores" ON public.snake_highscores FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert snake highscores" ON public.snake_highscores FOR INSERT TO anon WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.snake_highscores;

-- Memory Highscores
CREATE TABLE public.memory_highscores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  score INTEGER NOT NULL,
  moves INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.memory_highscores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read memory highscores" ON public.memory_highscores FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert memory highscores" ON public.memory_highscores FOR INSERT TO anon WITH CHECK (true);
CREATE INDEX idx_memory_highscores_score ON public.memory_highscores (difficulty, score DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_highscores;

-- Memory Sessions (server-side score validation)
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
CREATE INDEX idx_memory_sessions_token ON public.memory_sessions(session_token);
ALTER TABLE public.memory_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage memory sessions" ON public.memory_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Memory Events
CREATE TABLE public.memory_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.memory_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  card_a_id integer,
  card_b_id integer,
  event_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_memory_events_session ON public.memory_events(session_id);
ALTER TABLE public.memory_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage memory events" ON public.memory_events FOR ALL TO anon USING (true) WITH CHECK (true);

-- Scribble Lobbies
CREATE TABLE public.scribble_lobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  creator_username TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'waiting',
  current_word TEXT,
  current_drawer_id UUID,
  round_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.scribble_lobbies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can read lobbies" ON public.scribble_lobbies FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can create lobbies" ON public.scribble_lobbies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update lobbies" ON public.scribble_lobbies FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete finished lobbies" ON public.scribble_lobbies FOR DELETE TO anon USING (status = 'finished');
ALTER PUBLICATION supabase_realtime ADD TABLE public.scribble_lobbies;

-- Scribble Players
CREATE TABLE public.scribble_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.scribble_lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (lobby_id, user_id)
);
ALTER TABLE public.scribble_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can read players" ON public.scribble_players FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can join lobbies" ON public.scribble_players FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update score" ON public.scribble_players FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can leave lobbies" ON public.scribble_players FOR DELETE TO anon USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.scribble_players;

-- Scribble Guesses
CREATE TABLE public.scribble_guesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.scribble_lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  guess TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.scribble_guesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can read guesses" ON public.scribble_guesses FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can submit guesses" ON public.scribble_guesses FOR INSERT TO anon WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.scribble_guesses;
