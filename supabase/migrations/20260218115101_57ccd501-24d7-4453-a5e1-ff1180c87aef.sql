
-- Scribble lobbies
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

CREATE POLICY "Authenticated users can read lobbies"
  ON public.scribble_lobbies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create lobbies"
  ON public.scribble_lobbies FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creator can update lobby"
  ON public.scribble_lobbies FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creator can delete lobby"
  ON public.scribble_lobbies FOR DELETE
  USING (auth.uid() = creator_id);

-- Scribble players
CREATE TABLE public.scribble_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.scribble_lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scribble_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read players"
  ON public.scribble_players FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join lobbies"
  ON public.scribble_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave lobbies"
  ON public.scribble_players FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own score"
  ON public.scribble_players FOR UPDATE
  USING (auth.uid() = user_id);

-- Scribble guesses (chat)
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

CREATE POLICY "Authenticated users can read guesses"
  ON public.scribble_guesses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can submit guesses"
  ON public.scribble_guesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for all scribble tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.scribble_lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scribble_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scribble_guesses;
