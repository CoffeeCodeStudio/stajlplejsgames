CREATE OR REPLACE FUNCTION public.delete_user_cascade(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if caller is deleting their own account OR is an admin
  IF auth.uid() != p_user_id AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'You can only delete your own account, or must be admin';
  END IF;

  -- All deletes in a single transaction
  DELETE FROM public.guestbook_entries WHERE user_id = p_user_id;
  DELETE FROM public.profile_guestbook WHERE author_id = p_user_id OR profile_owner_id = p_user_id;
  DELETE FROM public.klotter WHERE user_id = p_user_id;
  DELETE FROM public.messages WHERE sender_id = p_user_id OR recipient_id = p_user_id;
  DELETE FROM public.chat_messages WHERE sender_id = p_user_id OR recipient_id = p_user_id;
  DELETE FROM public.friends WHERE user_id = p_user_id OR friend_id = p_user_id;
  DELETE FROM public.friend_votes WHERE voter_id = p_user_id OR target_user_id = p_user_id;
  DELETE FROM public.good_vibes WHERE giver_id = p_user_id;
  DELETE FROM public.good_vibe_allowances WHERE user_id = p_user_id;
  DELETE FROM public.lajv_messages WHERE user_id = p_user_id;
  DELETE FROM public.profile_visits WHERE visitor_id = p_user_id OR profile_owner_id = p_user_id;
  DELETE FROM public.avatar_uploads WHERE user_id = p_user_id;
  DELETE FROM public.snake_highscores WHERE user_id = p_user_id;
  DELETE FROM public.memory_highscores WHERE user_id = p_user_id;
  DELETE FROM public.call_participants WHERE user_id = p_user_id;
  DELETE FROM public.call_sessions WHERE caller_id = p_user_id;
  DELETE FROM public.scribble_guesses WHERE user_id = p_user_id;
  DELETE FROM public.scribble_players WHERE user_id = p_user_id;
  DELETE FROM public.scribble_lobbies WHERE creator_id = p_user_id;
  DELETE FROM public.bot_settings WHERE user_id = p_user_id;
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.profiles WHERE user_id = p_user_id;
END;
$$;