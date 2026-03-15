
CREATE OR REPLACE FUNCTION public.delete_user_cascade(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users';
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
  DELETE FROM public.bot_settings WHERE user_id = p_user_id;
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.profiles WHERE user_id = p_user_id;
END;
$$;
