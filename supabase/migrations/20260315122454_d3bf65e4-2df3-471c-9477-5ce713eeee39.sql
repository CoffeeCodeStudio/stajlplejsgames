
-- Allow anon users to SELECT scribble_lobbies
CREATE POLICY "Anon can read lobbies"
ON public.scribble_lobbies FOR SELECT
TO anon
USING (true);

-- Allow anon users to INSERT scribble_lobbies
CREATE POLICY "Anon can create lobbies"
ON public.scribble_lobbies FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to UPDATE scribble_lobbies
CREATE POLICY "Anon can update lobbies"
ON public.scribble_lobbies FOR UPDATE
TO anon
USING (true);

-- Allow anon users to DELETE scribble_lobbies
CREATE POLICY "Anon can delete finished lobbies"
ON public.scribble_lobbies FOR DELETE
TO anon
USING (status = 'finished');

-- Allow anon users to SELECT scribble_players
CREATE POLICY "Anon can read players"
ON public.scribble_players FOR SELECT
TO anon
USING (true);

-- Allow anon users to INSERT scribble_players
CREATE POLICY "Anon can join lobbies"
ON public.scribble_players FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to UPDATE scribble_players (score)
CREATE POLICY "Anon can update score"
ON public.scribble_players FOR UPDATE
TO anon
USING (true);

-- Allow anon users to DELETE scribble_players (leave)
CREATE POLICY "Anon can leave lobbies"
ON public.scribble_players FOR DELETE
TO anon
USING (true);

-- Allow anon users to SELECT scribble_guesses
CREATE POLICY "Anon can read guesses"
ON public.scribble_guesses FOR SELECT
TO anon
USING (true);

-- Allow anon users to INSERT scribble_guesses
CREATE POLICY "Anon can submit guesses"
ON public.scribble_guesses FOR INSERT
TO anon
WITH CHECK (true);

-- Enable realtime for players and guesses tables too
ALTER PUBLICATION supabase_realtime ADD TABLE public.scribble_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scribble_guesses;
