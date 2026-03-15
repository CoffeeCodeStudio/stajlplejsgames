-- Create good_vibes table to store given vibes
CREATE TABLE public.good_vibes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giver_id UUID NOT NULL,
  target_type TEXT NOT NULL, -- 'guestbook', 'post', 'message', etc.
  target_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(giver_id, target_type, target_id) -- One vibe per target per user
);

-- Create good_vibe_allowances table to track monthly allowances
CREATE TABLE public.good_vibe_allowances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  monthly_allowance INTEGER NOT NULL DEFAULT 0,
  vibes_used_this_month INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now()),
  is_paid_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.good_vibes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.good_vibe_allowances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for good_vibes
CREATE POLICY "Anyone can read good_vibes" 
ON public.good_vibes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can give good_vibes" 
ON public.good_vibes 
FOR INSERT 
WITH CHECK (auth.uid() = giver_id);

-- Good vibes are permanent - no delete or update allowed for regular users
-- (only admin cleanup if needed via service role)

-- RLS Policies for good_vibe_allowances
CREATE POLICY "Users can read their own allowance" 
ON public.good_vibe_allowances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allowance" 
ON public.good_vibe_allowances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allowance" 
ON public.good_vibe_allowances 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to reset monthly vibes if needed
CREATE OR REPLACE FUNCTION public.reset_monthly_vibes_if_needed(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.good_vibe_allowances
  SET 
    vibes_used_this_month = 0,
    last_reset_at = date_trunc('month', now()),
    updated_at = now()
  WHERE user_id = p_user_id
    AND last_reset_at < date_trunc('month', now());
END;
$$;

-- Function to give a good vibe (handles allowance check)
CREATE OR REPLACE FUNCTION public.give_good_vibe(
  p_target_type TEXT,
  p_target_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_allowance RECORD;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  
  -- Reset monthly vibes if new month
  PERFORM reset_monthly_vibes_if_needed(v_user_id);
  
  -- Get or create allowance
  INSERT INTO good_vibe_allowances (user_id, monthly_allowance, is_paid_user)
  VALUES (v_user_id, 0, false)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO v_allowance 
  FROM good_vibe_allowances 
  WHERE user_id = v_user_id;
  
  -- Check if user has vibes left
  IF v_allowance.vibes_used_this_month >= v_allowance.monthly_allowance THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'no_vibes_left',
      'allowance', v_allowance.monthly_allowance,
      'used', v_allowance.vibes_used_this_month
    );
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
  
  -- Give the vibe
  INSERT INTO good_vibes (giver_id, target_type, target_id)
  VALUES (v_user_id, p_target_type, p_target_id);
  
  -- Decrement allowance
  UPDATE good_vibe_allowances
  SET 
    vibes_used_this_month = vibes_used_this_month + 1,
    updated_at = now()
  WHERE user_id = v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'vibes_remaining', v_allowance.monthly_allowance - v_allowance.vibes_used_this_month - 1
  );
END;
$$;

-- Function to count good vibes for a target
CREATE OR REPLACE FUNCTION public.count_good_vibes(
  p_target_type TEXT,
  p_target_id TEXT
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM good_vibes
  WHERE target_type = p_target_type AND target_id = p_target_id;
$$;

-- Function to check if user has vibed a target
CREATE OR REPLACE FUNCTION public.has_user_vibed(
  p_target_type TEXT,
  p_target_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM good_vibes 
    WHERE giver_id = auth.uid() 
      AND target_type = p_target_type 
      AND target_id = p_target_id
  );
$$;