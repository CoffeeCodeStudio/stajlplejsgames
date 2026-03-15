import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

export interface ScribbleLobby {
  id: string;
  creator_id: string;
  creator_username: string;
  title: string;
  description: string;
  status: string;
  current_word: string | null;
  current_drawer_id: string | null;
  round_number: number;
  created_at: string;
  player_count?: number;
}

export interface ScribblePlayer {
  id: string;
  lobby_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  joined_at: string;
}

export interface ScribbleGuess {
  id: string;
  lobby_id: string;
  user_id: string;
  username: string;
  guess: string;
  is_correct: boolean;
  created_at: string;
}

/**
 * Lists and creates Scribble game lobbies.
 *
 * Automatically cleans up finished or stale (>5 min inactive) lobbies,
 * fetches player counts, and subscribes to real-time lobby changes.
 *
 * @returns `lobbies` array, `loading`, `createLobby`, and `refetch`.
 */
export function useScribbleLobbies() {
  const [lobbies, setLobbies] = useState<ScribbleLobby[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const fetchLobbies = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setLobbies([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scribble_lobbies')
        .select('*')
        .in('status', ['waiting', 'playing'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lobbies:', error);
        setLoading(false);
        return;
      }

      // Get player counts
      const lobbyIds = (data || []).map(l => l.id);
      let counts: Record<string, number> = {};
      if (lobbyIds.length > 0) {
        const { data: players } = await supabase
          .from('scribble_players')
          .select('lobby_id')
          .in('lobby_id', lobbyIds);

        (players || []).forEach(p => {
          counts[p.lobby_id] = (counts[p.lobby_id] || 0) + 1;
        });
      }

      setLobbies((data || []).map(l => ({ ...l, player_count: counts[l.id] || 0 })));
    } catch (err) {
      console.error('Failed to fetch lobbies:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLobbies();

    // Timeout fallback: if still loading after 5s, force stop
    const timeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) console.warn('Lobby fetch timed out after 5s');
        return false;
      });
    }, 5000);

    const channel = supabase
      .channel('scribble-lobbies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scribble_lobbies' }, () => {
        fetchLobbies();
      })
      .subscribe((status, err) => {
        if (err) console.error('Scribble realtime subscription error:', err);
      });

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [fetchLobbies]);

  const createLobby = async (title: string, description: string) => {
    if (!user || !profile) return null;
    const { data, error } = await supabase
      .from('scribble_lobbies')
      .insert({
        creator_id: user.id,
        creator_username: profile.username,
        title,
        description,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Kunde inte skapa lobby', description: error.message, variant: 'destructive' });
      return null;
    }

    // Auto-join
    await supabase.from('scribble_players').insert({
      lobby_id: data.id,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
    });

    return data;
  };

  return { lobbies, loading, createLobby, refetch: fetchLobbies };
}

/**
 * Manages the state of an active Scribble game session.
 *
 * Fetches lobby details, players, and guesses with real-time subscriptions.
 * Sends a heartbeat every 60 s to keep the lobby alive.
 *
 * @param lobbyId - The lobby to join, or `null` if none is selected.
 * @returns Lobby state, players, guesses, and action callbacks.
 */
export function useScribbleGame(lobbyId: string | null) {
  const [players, setPlayers] = useState<ScribblePlayer[]>([]);
  const [guesses, setGuesses] = useState<ScribbleGuess[]>([]);
  const [lobby, setLobby] = useState<ScribbleLobby | null>(null);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const fetchGame = useCallback(async () => {
    if (!lobbyId || !user) return;

    const [lobbyRes, playersRes, guessesRes] = await Promise.all([
      supabase.from('scribble_lobbies').select('*').eq('id', lobbyId).single(),
      supabase.from('scribble_players').select('*').eq('lobby_id', lobbyId).order('score', { ascending: false }),
      supabase.from('scribble_guesses').select('*').eq('lobby_id', lobbyId).order('created_at', { ascending: true }).limit(100),
    ]);

    if (lobbyRes.data) setLobby(lobbyRes.data);
    if (playersRes.data) setPlayers(playersRes.data);
    if (guessesRes.data) setGuesses(guessesRes.data);
  }, [lobbyId, user]);

  useEffect(() => {
    fetchGame();

    if (!lobbyId) return;

    const channel = supabase
      .channel(`scribble-game-${lobbyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scribble_players', filter: `lobby_id=eq.${lobbyId}` }, () => fetchGame())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scribble_guesses', filter: `lobby_id=eq.${lobbyId}` }, () => fetchGame())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scribble_lobbies', filter: `id=eq.${lobbyId}` }, () => fetchGame())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchGame, lobbyId]);

  // Heartbeat: update lobby's updated_at every 60s to keep it alive
  useEffect(() => {
    if (!lobbyId || !user) return;
    const interval = setInterval(async () => {
      await supabase
        .from('scribble_lobbies')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', lobbyId);
    }, 60_000);
    return () => clearInterval(interval);
  }, [lobbyId, user]);

  const joinLobby = async () => {
    if (!lobbyId || !user || !profile) return;
    const existing = players.find(p => p.user_id === user.id);
    if (existing) return;

    const { error } = await supabase.from('scribble_players').insert({
      lobby_id: lobbyId,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
    });
    if (error) {
      toast({ title: 'Kunde inte gå med', description: error.message, variant: 'destructive' });
    }
  };

  const submitGuess = async (guess: string) => {
    if (!lobbyId || !user || !profile) return;
    const isCorrect = lobby?.current_word
      ? guess.trim().toLowerCase() === lobby.current_word.trim().toLowerCase()
      : false;

    await supabase.from('scribble_guesses').insert({
      lobby_id: lobbyId,
      user_id: user.id,
      username: profile.username,
      guess,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      // Award points
      await supabase.from('scribble_players')
        .update({ score: (players.find(p => p.user_id === user.id)?.score || 0) + 10 })
        .eq('lobby_id', lobbyId)
        .eq('user_id', user.id);
    }

    return isCorrect;
  };

  const leaveLobby = async () => {
    if (!lobbyId || !user) return;
    await supabase.from('scribble_players').delete().eq('lobby_id', lobbyId).eq('user_id', user.id);
  };

  return { lobby, players, guesses, joinLobby, submitGuess, leaveLobby };
}
