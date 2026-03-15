
-- Table to track active call sessions
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  channel_name TEXT NOT NULL UNIQUE,
  call_type TEXT NOT NULL DEFAULT 'voice', -- 'voice', 'video', 'screenshare'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Participants table for mesh calls (up to 4)
CREATE TABLE public.call_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(call_id, user_id)
);

ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for call_sessions
CREATE POLICY "Authenticated users can read call sessions"
  ON public.call_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create call sessions"
  ON public.call_sessions FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Caller can update their call session"
  ON public.call_sessions FOR UPDATE
  USING (auth.uid() = caller_id);

CREATE POLICY "Caller can delete their call session"
  ON public.call_sessions FOR DELETE
  USING (auth.uid() = caller_id);

-- RLS policies for call_participants
CREATE POLICY "Authenticated users can read participants"
  ON public.call_participants FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join calls"
  ON public.call_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON public.call_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave calls"
  ON public.call_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_participants;
