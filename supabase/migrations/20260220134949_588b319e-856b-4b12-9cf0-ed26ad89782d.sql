-- Create memory highscores table
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

-- Enable RLS
ALTER TABLE public.memory_highscores ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read highscores
CREATE POLICY "Authenticated users can read memory highscores"
ON public.memory_highscores FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can insert their own scores
CREATE POLICY "Users can insert own memory highscores"
ON public.memory_highscores FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for leaderboard queries
CREATE INDEX idx_memory_highscores_score ON public.memory_highscores (difficulty, score DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_highscores;