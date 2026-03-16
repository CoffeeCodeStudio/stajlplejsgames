
-- Drop trigger on auth.users first (references handle_new_user)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop unused tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.call_participants CASCADE;
DROP TABLE IF EXISTS public.call_sessions CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.friend_votes CASCADE;
DROP TABLE IF EXISTS public.friends CASCADE;
DROP TABLE IF EXISTS public.good_vibes CASCADE;
DROP TABLE IF EXISTS public.good_vibe_allowances CASCADE;
DROP TABLE IF EXISTS public.guestbook_entries CASCADE;
DROP TABLE IF EXISTS public.profile_guestbook CASCADE;
DROP TABLE IF EXISTS public.profile_visits CASCADE;
DROP TABLE IF EXISTS public.klotter CASCADE;
DROP TABLE IF EXISTS public.lajv_messages CASCADE;
DROP TABLE IF EXISTS public.daily_news CASCADE;
DROP TABLE IF EXISTS public.news_articles CASCADE;
DROP TABLE IF EXISTS public.avatar_uploads CASCADE;
DROP TABLE IF EXISTS public.bot_settings CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Drop unused functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.delete_user_cascade(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.count_good_vibes(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.give_good_vibe(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.has_user_vibed(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.reset_monthly_vibes_if_needed(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.delete_expired_lajv_messages() CASCADE;
DROP FUNCTION IF EXISTS public.validate_profile_fields() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;

-- Drop unused enum
DROP TYPE IF EXISTS public.app_role CASCADE;
