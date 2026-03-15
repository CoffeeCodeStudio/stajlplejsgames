-- Allow any authenticated user to delete stale/finished lobbies for cleanup
CREATE POLICY "Authenticated users can delete finished lobbies"
ON public.scribble_lobbies
FOR DELETE
USING (auth.uid() IS NOT NULL AND status IN ('finished'));

-- Allow any player in the lobby to update updated_at (heartbeat)
CREATE POLICY "Players can update lobby heartbeat"
ON public.scribble_lobbies
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.scribble_players
    WHERE scribble_players.lobby_id = scribble_lobbies.id
    AND scribble_players.user_id = auth.uid()
  )
);