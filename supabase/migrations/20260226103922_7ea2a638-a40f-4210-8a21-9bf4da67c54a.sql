
-- 1. Fix friend_votes: restrict SELECT to voter or target only
DROP POLICY IF EXISTS "Authenticated users can read friend votes" ON public.friend_votes;
CREATE POLICY "Users can read own friend votes"
  ON public.friend_votes FOR SELECT
  USING (auth.uid() = voter_id OR auth.uid() = target_user_id);

-- 2. Restrict call_sessions to participants only
DROP POLICY IF EXISTS "Authenticated users can read call sessions" ON public.call_sessions;
CREATE POLICY "Participants can read call sessions"
  ON public.call_sessions FOR SELECT
  USING (
    auth.uid() = caller_id
    OR EXISTS (
      SELECT 1 FROM public.call_participants
      WHERE call_participants.call_id = call_sessions.id
        AND call_participants.user_id = auth.uid()
    )
  );

-- 3. Restrict call_participants to participants of that call
DROP POLICY IF EXISTS "Authenticated users can read participants" ON public.call_participants;
CREATE POLICY "Participants can read call participants"
  ON public.call_participants FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.call_participants cp2
      WHERE cp2.call_id = call_participants.call_id
        AND cp2.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.call_sessions
      WHERE call_sessions.id = call_participants.call_id
        AND call_sessions.caller_id = auth.uid()
    )
  );

-- 4. Remove public read access to bot_settings (keep admin-only)
DROP POLICY IF EXISTS "Authenticated users can read bot_settings" ON public.bot_settings;

-- 5. Allow visitors to delete their own visit records
CREATE POLICY "Visitors can delete their own visits"
  ON public.profile_visits FOR DELETE
  USING (auth.uid() = visitor_id);
