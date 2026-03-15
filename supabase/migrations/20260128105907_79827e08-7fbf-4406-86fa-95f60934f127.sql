-- Create profile_visits table to track who visits which profile
CREATE TABLE public.profile_visits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_owner_id UUID NOT NULL,
    visitor_id UUID NOT NULL,
    visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Prevent duplicate visits in quick succession (unique per visitor-owner pair)
    UNIQUE(profile_owner_id, visitor_id)
);

-- Enable RLS
ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;

-- Profile owners can see their visitors
CREATE POLICY "Profile owners can see their visitors"
ON public.profile_visits
FOR SELECT
USING (auth.uid() = profile_owner_id);

-- Authenticated users can log their visits
CREATE POLICY "Authenticated users can log visits"
ON public.profile_visits
FOR INSERT
WITH CHECK (auth.uid() = visitor_id AND auth.uid() != profile_owner_id);

-- Users can update their own visit timestamps (for re-visits)
CREATE POLICY "Users can update their visit timestamp"
ON public.profile_visits
FOR UPDATE
USING (auth.uid() = visitor_id);

-- Index for efficient querying
CREATE INDEX idx_profile_visits_owner ON public.profile_visits(profile_owner_id, visited_at DESC);
CREATE INDEX idx_profile_visits_visitor ON public.profile_visits(visitor_id);