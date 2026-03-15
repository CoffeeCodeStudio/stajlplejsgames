
-- Fix: Require authentication to read published news
DROP POLICY IF EXISTS "Anyone can read published news" ON public.news_articles;

CREATE POLICY "Authenticated users can read published news"
  ON public.news_articles FOR SELECT
  USING (is_published = true AND auth.uid() IS NOT NULL);
