
-- Add is_approved column to profiles (default false for new registrations)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Temporarily disable the validation trigger
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- Set all existing users as approved so they aren't locked out
UPDATE public.profiles SET is_approved = true;

-- Re-enable triggers
ALTER TABLE public.profiles ENABLE TRIGGER ALL;
