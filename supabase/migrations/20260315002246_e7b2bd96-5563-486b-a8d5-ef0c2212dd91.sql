
-- Allow anonymous inserts to snake_highscores (for URL-param based scoring)
CREATE POLICY "Anyone can insert snake highscores"
ON public.snake_highscores
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous inserts to memory_highscores
CREATE POLICY "Anyone can insert memory highscores"
ON public.memory_highscores
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous reads on snake_highscores
CREATE POLICY "Anyone can read snake highscores"
ON public.snake_highscores
FOR SELECT
TO anon
USING (true);

-- Allow anonymous reads on memory_highscores
CREATE POLICY "Anyone can read memory highscores"
ON public.memory_highscores
FOR SELECT
TO anon
USING (true);
