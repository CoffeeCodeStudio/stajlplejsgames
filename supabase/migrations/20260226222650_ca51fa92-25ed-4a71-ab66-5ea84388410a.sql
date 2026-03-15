
-- Add is_bot column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;

-- Create index for quick bot lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_bot ON public.profiles (is_bot) WHERE is_bot = true;
