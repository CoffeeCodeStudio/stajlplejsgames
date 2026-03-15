
-- Create snake highscores table
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

-- Enable RLS
ALTER TABLE public.snake_highscores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read snake highscores"
  ON public.snake_highscores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own snake highscores"
  ON public.snake_highscores FOR INSERT
  WITH CHECK (auth.uid() = user_id);
