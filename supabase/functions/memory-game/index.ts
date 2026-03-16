import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DIFFICULTY_CONFIG: Record<string, { pairs: number }> = {
  easy: { pairs: 6 },
  medium: { pairs: 8 },
  hard: { pairs: 12 },
};

// Anti-cheat thresholds
const MIN_MS_BETWEEN_EVENTS = 350; // minimum ms between pair_found events
const MIN_GAME_DURATION_MS = 3000; // minimum total game duration

function calcScore(moves: number, seconds: number, pairs: number): number {
  const base = pairs * 100;
  const movePenalty = Math.max(0, (moves - pairs) * 5);
  const timePenalty = Math.floor(seconds / 2);
  return Math.max(0, base - movePenalty - timePenalty);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { action } = body;

    // ── START: Create a new game session ──
    if (action === "start") {
      const { username, difficulty } = body;

      if (!username || typeof username !== "string" || username.trim().length === 0) {
        return jsonError("Missing or invalid username", 400);
      }
      if (!difficulty || !DIFFICULTY_CONFIG[difficulty]) {
        return jsonError("Invalid difficulty", 400);
      }

      const sanitizedUsername = username.trim().slice(0, 30).replace(/[^a-zA-Z0-9_åäöÅÄÖ -]/g, "");
      if (!sanitizedUsername) {
        return jsonError("Invalid username after sanitization", 400);
      }

      const config = DIFFICULTY_CONFIG[difficulty];

      const { data, error } = await supabase
        .from("memory_sessions")
        .insert({
          username: sanitizedUsername,
          difficulty,
          pairs: config.pairs,
        })
        .select("id, session_token")
        .single();

      if (error) {
        console.error("Start session error:", error);
        return jsonError("Failed to create session", 500);
      }

      return jsonOk({ session_id: data.id, session_token: data.session_token });
    }

    // ── EVENT: Log a game event ──
    if (action === "event") {
      const { session_token, event_type, card_a_id, card_b_id } = body;

      if (!session_token) return jsonError("Missing session_token", 400);
      if (!event_type || !["pair_found", "mismatch"].includes(event_type)) {
        return jsonError("Invalid event_type", 400);
      }

      // Verify session exists and is valid
      const { data: session, error: sessError } = await supabase
        .from("memory_sessions")
        .select("id, is_valid, finished_at")
        .eq("session_token", session_token)
        .single();

      if (sessError || !session) return jsonError("Invalid session", 401);
      if (!session.is_valid) return jsonError("Session invalidated", 403);
      if (session.finished_at) return jsonError("Session already finished", 400);

      // Insert event
      const { error: evtError } = await supabase
        .from("memory_events")
        .insert({
          session_id: session.id,
          event_type,
          card_a_id: card_a_id ?? null,
          card_b_id: card_b_id ?? null,
        });

      if (evtError) {
        console.error("Event insert error:", evtError);
        return jsonError("Failed to log event", 500);
      }

      return jsonOk({ ok: true });
    }

    // ── FINISH: Validate and calculate final score ──
    if (action === "finish") {
      const { session_token } = body;
      if (!session_token) return jsonError("Missing session_token", 400);

      // Get session
      const { data: session, error: sessError } = await supabase
        .from("memory_sessions")
        .select("*")
        .eq("session_token", session_token)
        .single();

      if (sessError || !session) return jsonError("Invalid session", 401);
      if (!session.is_valid) return jsonError("Session invalidated", 403);
      if (session.finished_at) return jsonError("Session already finished", 400);

      // Get all events for this session
      const { data: events, error: evtError } = await supabase
        .from("memory_events")
        .select("*")
        .eq("session_id", session.id)
        .order("event_at", { ascending: true });

      if (evtError) return jsonError("Failed to fetch events", 500);

      const pairEvents = (events || []).filter((e: any) => e.event_type === "pair_found");
      const allEvents = events || [];
      const expectedPairs = session.pairs;

      // ── ANTI-CHEAT VALIDATION ──
      let invalidReason: string | null = null;

      // 1. Must have exactly the right number of pair_found events
      if (pairEvents.length !== expectedPairs) {
        invalidReason = `Expected ${expectedPairs} pair_found events, got ${pairEvents.length}`;
      }

      // 2. Check minimum time between consecutive events
      if (!invalidReason && allEvents.length > 1) {
        for (let i = 1; i < allEvents.length; i++) {
          const diff = new Date(allEvents[i].event_at).getTime() - new Date(allEvents[i - 1].event_at).getTime();
          if (diff < MIN_MS_BETWEEN_EVENTS) {
            invalidReason = `Events too fast: ${diff}ms between event ${i - 1} and ${i}`;
            break;
          }
        }
      }

      // 3. Check minimum total game duration
      if (!invalidReason && allEvents.length > 0) {
        const startTime = new Date(session.started_at).getTime();
        const lastEventTime = new Date(allEvents[allEvents.length - 1].event_at).getTime();
        const totalDuration = lastEventTime - startTime;
        if (totalDuration < MIN_GAME_DURATION_MS) {
          invalidReason = `Game too fast: ${totalDuration}ms total`;
        }
      }

      // Calculate score from validated events
      const startTime = new Date(session.started_at).getTime();
      const endTime = allEvents.length > 0
        ? new Date(allEvents[allEvents.length - 1].event_at).getTime()
        : Date.now();
      const totalSeconds = Math.floor((endTime - startTime) / 1000);
      const totalMoves = allEvents.length; // each event = 1 move (pair attempt)
      const score = calcScore(totalMoves, totalSeconds, expectedPairs);

      // Mark session as finished
      await supabase
        .from("memory_sessions")
        .update({
          finished_at: new Date().toISOString(),
          is_valid: !invalidReason,
          score,
        })
        .eq("id", session.id);

      if (invalidReason) {
        console.warn(`Session ${session.id} invalidated: ${invalidReason}`);
        return jsonOk({ valid: false, reason: "Session flagged as suspicious", score: 0 });
      }

      // Save to highscores (only if valid)
      const { error: hsError } = await supabase
        .from("memory_highscores")
        .insert({
          user_id: "00000000-0000-0000-0000-000000000000",
          username: session.username,
          avatar_url: null,
          score,
          moves: totalMoves,
          time_seconds: totalSeconds,
          difficulty: session.difficulty,
        });

      if (hsError) {
        console.error("Highscore insert error:", hsError);
      }

      return jsonOk({
        valid: true,
        score,
        moves: totalMoves,
        time_seconds: totalSeconds,
      });
    }

    return jsonError("Unknown action", 400);
  } catch (error) {
    console.error("Memory game error:", error);
    return jsonError("Internal error", 500);
  }
});

function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
