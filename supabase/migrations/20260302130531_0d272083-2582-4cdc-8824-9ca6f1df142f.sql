
-- Add tone_of_voice column to bot_settings for personality diversity
ALTER TABLE public.bot_settings ADD COLUMN IF NOT EXISTS tone_of_voice text NOT NULL DEFAULT 'nostalgikern';

-- Add recent_phrases column to track anti-repetitive logic
ALTER TABLE public.bot_settings ADD COLUMN IF NOT EXISTS recent_phrases jsonb NOT NULL DEFAULT '[]'::jsonb;
