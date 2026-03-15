-- Table for admin-managed daily news topics that bots will discuss
CREATE TABLE public.daily_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.daily_news ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage daily_news"
  ON public.daily_news
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read active news
CREATE POLICY "Authenticated users can read active daily_news"
  ON public.daily_news
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);