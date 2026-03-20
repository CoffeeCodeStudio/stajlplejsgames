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
  last_seen: string;
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
      // Clean up stale lobbies (no activity for 30+ minutes)
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: staleLobbies } = await supabase
        .from('scribble_lobbies')
        .select('id')
        .in('status', ['waiting', 'playing'])
        .lt('updated_at', thirtyMinAgo);

      if (staleLobbies && staleLobbies.length > 0) {
        const staleIds = staleLobbies.map(l => l.id);
        // Delete players and guesses first, then mark lobby as finished and delete
        await supabase.from('scribble_guesses').delete().in('lobby_id', staleIds);
        await supabase.from('scribble_players').delete().in('lobby_id', staleIds);
        await supabase
          .from('scribble_lobbies')
          .update({ status: 'finished' })
          .in('id', staleIds);
        await supabase.from('scribble_lobbies').delete().in('id', staleIds);
        console.log(`Cleaned up ${staleIds.length} stale lobby(ies)`);
      }

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

    // Auto-join (upsert to avoid duplicates)
    await supabase.from('scribble_players').upsert({
      lobby_id: data.id,
      user_id: guestId,
      username,
      avatar_url: null,
    }, { onConflict: 'lobby_id,user_id' });

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

  // Per-player heartbeat: update last_seen every 30s, also update lobby updated_at
  useEffect(() => {
    if (!lobbyId || !guestId) return;

    // Send heartbeat immediately on mount
    const sendHeartbeat = async () => {
      const now = new Date().toISOString();
      await Promise.all([
        supabase
          .from('scribble_players')
          .update({ last_seen: now })
          .eq('lobby_id', lobbyId)
          .eq('user_id', guestId),
        supabase
          .from('scribble_lobbies')
          .update({ updated_at: now })
          .eq('id', lobbyId),
      ]);
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 30_000);

    return () => clearInterval(heartbeatInterval);
  }, [lobbyId, guestId]);

  // Stale player cleanup: check every 15s, remove players inactive >90s, advance turn if drawer removed
  useEffect(() => {
    if (!lobbyId) return;

    const cleanupStale = async () => {
      const ninetySecAgo = new Date(Date.now() - 90_000).toISOString();

      const { data: stalePlayers } = await supabase
        .from('scribble_players')
        .select('user_id, username')
        .eq('lobby_id', lobbyId)
        .lt('last_seen', ninetySecAgo);

      if (!stalePlayers || stalePlayers.length === 0) return;

      for (const stale of stalePlayers) {
        // Post leave notification
        await supabase.from('scribble_guesses').insert({
          lobby_id: lobbyId,
          user_id: stale.user_id,
          username: stale.username,
          guess: `⚡ ${stale.username} kopplades bort`,
          is_correct: false,
        });

        // Remove the player
        await supabase
          .from('scribble_players')
          .delete()
          .eq('lobby_id', lobbyId)
          .eq('user_id', stale.user_id);
      }

      // Check remaining players
      const { data: remaining } = await supabase
        .from('scribble_players')
        .select('user_id')
        .eq('lobby_id', lobbyId);

      const remainingPlayers = remaining || [];

      if (remainingPlayers.length === 0) {
        // All gone — finish and delete lobby
        await supabase.from('scribble_guesses').delete().eq('lobby_id', lobbyId);
        await supabase.from('scribble_lobbies').update({ status: 'finished' }).eq('id', lobbyId);
        await supabase.from('scribble_lobbies').delete().eq('id', lobbyId);
      } else {
        // If any stale player was the current drawer, advance turn
        const currentLobby = lobby;
        const staleIds = stalePlayers.map(s => s.user_id);
        if (currentLobby?.current_drawer_id && staleIds.includes(currentLobby.current_drawer_id)) {
          const nextDrawer = remainingPlayers[0];
          await supabase.from('scribble_lobbies').update({
            current_drawer_id: nextDrawer.user_id,
            current_word: null,
            round_number: (currentLobby.round_number || 0) + 1,
          }).eq('id', lobbyId);
        }
      }
    };

    const cleanupInterval = setInterval(cleanupStale, 15_000);
    return () => clearInterval(cleanupInterval);
  }, [lobbyId, lobby?.current_drawer_id, lobby?.round_number]); // eslint-disable-line

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

    // Post a leave notification as a system guess
    await supabase.from('scribble_guesses').insert({
      lobby_id: lobbyId,
      user_id: guestId,
      username,
      guess: `📤 ${username} lämnade spelet`,
      is_correct: false,
    });

    // Remove the player
    await supabase.from('scribble_players').delete().eq('lobby_id', lobbyId).eq('user_id', guestId);

    // Check remaining players
    const { data: remaining } = await supabase
      .from('scribble_players')
      .select('user_id')
      .eq('lobby_id', lobbyId);

    const remainingPlayers = remaining || [];

    if (remainingPlayers.length === 0) {
      // Last player left — clean up lobby
      await supabase.from('scribble_guesses').delete().eq('lobby_id', lobbyId);
      await supabase.from('scribble_lobbies').update({ status: 'finished' }).eq('id', lobbyId);
      await supabase.from('scribble_lobbies').delete().eq('id', lobbyId);
    } else if (lobby?.current_drawer_id === guestId && lobby?.status === 'playing') {
      // Drawer left — advance to next player
      const nextDrawer = remainingPlayers[0];
      await supabase.from('scribble_lobbies').update({
        current_drawer_id: nextDrawer.user_id,
        current_word: null,
        round_number: (lobby.round_number || 0) + 1,
      }).eq('id', lobbyId);
    }
  };

  return { lobby, players, guesses, joinLobby, submitGuess, leaveLobby, visitorId: guestId };
}
