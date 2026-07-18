-- The migration consolidation in 001_initial_schema.sql reintroduced open
-- anon policies on both the snake and memory anti-cheat tables, which lets
-- anyone bypass the snake-game/memory-game edge functions' validation
-- entirely by writing directly to these tables via the Supabase API.
-- Lock them all down to service_role.

DROP POLICY IF EXISTS "Anyone can manage snake sessions" ON public.snake_sessions;
DROP POLICY IF EXISTS "Anyone can manage snake events" ON public.snake_events;
DROP POLICY IF EXISTS "Anyone can insert snake highscores" ON public.snake_highscores;

CREATE POLICY "Service role manages snake sessions" ON public.snake_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages snake events" ON public.snake_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role inserts snake highscores" ON public.snake_highscores
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can manage memory sessions" ON public.memory_sessions;
DROP POLICY IF EXISTS "Anyone can manage memory events" ON public.memory_events;
DROP POLICY IF EXISTS "Anyone can insert memory highscores" ON public.memory_highscores;

CREATE POLICY "Service role manages memory sessions" ON public.memory_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages memory events" ON public.memory_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role inserts memory highscores" ON public.memory_highscores
  FOR INSERT TO service_role WITH CHECK (true);
