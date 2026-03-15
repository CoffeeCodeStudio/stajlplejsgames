-- =============================================
-- SECURITY FIX: Profiles table - restrict to authenticated users
-- =============================================
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
CREATE POLICY "Authenticated users can read profiles" 
ON profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- =============================================
-- SECURITY FIX: Good vibes table - restrict to own vibes only
-- The app uses SECURITY DEFINER functions for counts/checks
-- =============================================
DROP POLICY IF EXISTS "Anyone can read good_vibes" ON good_vibes;
CREATE POLICY "Users can read own vibes" 
ON good_vibes 
FOR SELECT 
USING (auth.uid() = giver_id);

-- =============================================
-- SECURITY FIX: Lajv messages - require authentication for insert/delete
-- =============================================
DROP POLICY IF EXISTS "Anyone can insert lajv messages" ON lajv_messages;
CREATE POLICY "Authenticated users can insert lajv messages" 
ON lajv_messages 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can delete lajv messages" ON lajv_messages;
CREATE POLICY "Users can delete own lajv messages" 
ON lajv_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- =============================================
-- SECURITY FIX: Add message length constraints
-- =============================================
ALTER TABLE lajv_messages DROP CONSTRAINT IF EXISTS message_length_check;
ALTER TABLE lajv_messages ADD CONSTRAINT message_length_check 
CHECK (length(message) > 0 AND length(message) <= 280);

ALTER TABLE lajv_messages DROP CONSTRAINT IF EXISTS username_length_check;
ALTER TABLE lajv_messages ADD CONSTRAINT username_length_check 
CHECK (length(username) > 0 AND length(username) <= 50);

-- Also add constraints to guestbook_entries
ALTER TABLE guestbook_entries DROP CONSTRAINT IF EXISTS message_length_check;
ALTER TABLE guestbook_entries ADD CONSTRAINT message_length_check 
CHECK (length(message) > 0 AND length(message) <= 500);

ALTER TABLE guestbook_entries DROP CONSTRAINT IF EXISTS author_name_length_check;
ALTER TABLE guestbook_entries ADD CONSTRAINT author_name_length_check 
CHECK (length(author_name) > 0 AND length(author_name) <= 50);

-- =============================================
-- SECURITY FIX: Add input validation to SECURITY DEFINER functions
-- =============================================

-- Fix give_good_vibe with input validation
CREATE OR REPLACE FUNCTION public.give_good_vibe(p_target_type text, p_target_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  
  -- INPUT VALIDATION: Whitelist target_type
  IF p_target_type NOT IN ('guestbook', 'post', 'message', 'profile', 'lajv') THEN
    RETURN json_build_object('success', false, 'error', 'invalid_target_type');
  END IF;
  
  -- INPUT VALIDATION: Validate UUID format for target_id
  IF p_target_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN json_build_object('success', false, 'error', 'invalid_target_id');
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
$$;

-- Fix count_good_vibes with input validation
CREATE OR REPLACE FUNCTION public.count_good_vibes(p_target_type text, p_target_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INPUT VALIDATION: Whitelist target_type
  IF p_target_type NOT IN ('guestbook', 'post', 'message', 'profile', 'lajv') THEN
    RETURN 0;
  END IF;
  
  -- INPUT VALIDATION: Validate UUID format for target_id
  IF p_target_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN 0;
  END IF;
  
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM good_vibes
    WHERE target_type = p_target_type AND target_id = p_target_id
  );
END;
$$;

-- Fix has_user_vibed with input validation
CREATE OR REPLACE FUNCTION public.has_user_vibed(p_target_type text, p_target_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INPUT VALIDATION: Whitelist target_type
  IF p_target_type NOT IN ('guestbook', 'post', 'message', 'profile', 'lajv') THEN
    RETURN false;
  END IF;
  
  -- INPUT VALIDATION: Validate UUID format for target_id
  IF p_target_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM good_vibes 
    WHERE giver_id = auth.uid() 
      AND target_type = p_target_type 
      AND target_id = p_target_id
  );
END;
$$;