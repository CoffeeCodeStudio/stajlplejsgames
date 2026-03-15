-- Add automation columns to bot_settings
ALTER TABLE public.bot_settings
ADD COLUMN IF NOT EXISTS allowed_contexts text[] NOT NULL DEFAULT '{chat,guestbook}'::text[],
ADD COLUMN IF NOT EXISTS cron_interval text NOT NULL DEFAULT '*/5 * * * *';