-- Add more profile fields to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS occupation TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS relationship TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS personality TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS hair_color TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS body_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS clothing TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS likes TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS eats TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS listens_to TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS prefers TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interests TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS spanar_in TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS status_message TEXT DEFAULT '';

-- Create trigger to auto-create profile on signup if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();