import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
 * Works for both authenticated and guest users.
 */
export function useScribbleLobbies(guestId: string, guestUsername: string | null) {
  const [lobbies, setLobbies] = useState<ScribbleLobby[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLobbies = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchLobbies();

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
    const username = guestUsername || 'Gäst';
    const { data, error } = await supabase
      .from('scribble_lobbies')
      .insert({
        creator_id: guestId,
        creator_username: username,
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
      user_id: guestId,
      username,
      avatar_url: null,
    });

    return data;
  };

  return { lobbies, loading, createLobby, refetch: fetchLobbies };
}

/**
 * Manages the state of an active Scribble game session.
 * Works for both authenticated and guest users.
 */
export function useScribbleGame(lobbyId: string | null, guestId: string, guestUsername: string | null) {
  const [players, setPlayers] = useState<ScribblePlayer[]>([]);
  const [guesses, setGuesses] = useState<ScribbleGuess[]>([]);
  const [lobby, setLobby] = useState<ScribbleLobby | null>(null);
  const { toast } = useToast();

  const username = guestUsername || 'Gäst';

  const fetchGame = useCallback(async () => {
    if (!lobbyId) return;

    const [lobbyRes, playersRes, guessesRes] = await Promise.all([
      supabase.from('scribble_lobbies').select('*').eq('id', lobbyId).single(),
      supabase.from('scribble_players').select('*').eq('lobby_id', lobbyId).order('score', { ascending: false }),
      supabase.from('scribble_guesses').select('*').eq('lobby_id', lobbyId).order('created_at', { ascending: true }).limit(100),
    ]);

    if (lobbyRes.data) setLobby(lobbyRes.data);
    if (playersRes.data) setPlayers(playersRes.data);
    if (guessesRes.data) setGuesses(guessesRes.data);
  }, [lobbyId]);

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

  // Heartbeat
  useEffect(() => {
    if (!lobbyId) return;
    const interval = setInterval(async () => {
      await supabase
        .from('scribble_lobbies')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', lobbyId);
    }, 60_000);
    return () => clearInterval(interval);
  }, [lobbyId]);

  const joinLobby = async () => {
    if (!lobbyId) return;
    const existing = players.find(p => p.user_id === guestId);
    if (existing) return;

    const { error } = await supabase.from('scribble_players').insert({
      lobby_id: lobbyId,
      user_id: guestId,
      username,
      avatar_url: null,
    });
    if (error) {
      toast({ title: 'Kunde inte gå med', description: error.message, variant: 'destructive' });
    }
  };

  const submitGuess = async (guess: string) => {
    if (!lobbyId) return;
    const isCorrect = lobby?.current_word
      ? guess.trim().toLowerCase() === lobby.current_word.trim().toLowerCase()
      : false;

    await supabase.from('scribble_guesses').insert({
      lobby_id: lobbyId,
      user_id: guestId,
      username,
      guess,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      await supabase.from('scribble_players')
        .update({ score: (players.find(p => p.user_id === guestId)?.score || 0) + 10 })
        .eq('lobby_id', lobbyId)
        .eq('user_id', guestId);
    }

    return isCorrect;
  };

  const leaveLobby = async () => {
    if (!lobbyId) return;
    await supabase.from('scribble_players').delete().eq('lobby_id', lobbyId).eq('user_id', guestId);
  };

  return { lobby, players, guesses, joinLobby, submitGuess, leaveLobby, visitorId: guestId };
}
