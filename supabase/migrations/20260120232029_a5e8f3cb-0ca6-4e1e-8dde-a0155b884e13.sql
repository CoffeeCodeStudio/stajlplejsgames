-- Drop existing function and recreate with unlimited vibes
CREATE OR REPLACE FUNCTION public.give_good_vibe(p_target_type text, p_target_id text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  
  -- Check if already gave vibe to this target
  IF EXISTS (
    SELECT 1 FROM good_vibes 
    WHERE giver_id = v_user_id 
      AND target_type = p_target_type 
      AND target_id = p_target_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'already_vibed');
  END IF;
  
  -- Give the vibe (no limits!)
  INSERT INTO good_vibes (giver_id, target_type, target_id)
  VALUES (v_user_id, p_target_type, p_target_id);
  
  RETURN json_build_object(
    'success', true,
    'vibes_remaining', -1
  );
END;
$function$;

-- Recreate the trigger for new users to ensure profiles are created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    username,
    bio,
    city,
    gender,
    occupation,
    relationship,
    personality,
    hair_color,
    body_type,
    clothing,
    likes,
    eats,
    listens_to,
    prefers,
    interests,
    spanar_in,
    status_message,
    looking_for
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{}'::text[]
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();