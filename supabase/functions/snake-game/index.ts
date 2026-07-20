// Server-authoritative scoring for Snake, mirroring memory-game/index.ts:
// runs with service_role (bypasses RLS) and is the only path that can
// write to snake_highscores, since the anon policies on
// snake_highscores/snake_sessions/snake_events are locked to service_role
// only (see supabase/migrations/002_lock_down_snake_rls.sql). The client
// logs each apple pickup as an "apple" event during play; on "finish" this
// function recomputes the score from that event log itself and checks the
// timing between events was physically possible before saving.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_MS_BETWEEN_APPLES = 200; // minimum ms between apple pickups (game min tick is 60ms but snake must travel)
const MIN_GAME_DURATION_MS = 2000;
const MAX_SCORE_PER_APPLE = 50; // sanity cap — no apple can give more than this

// Must match SnakeGame.tsx exactly
function calcScore(appleEvents: number[]): number {
  let score = 0;
  for (let i = 0; i < appleEvents.length; i++) {
    score += 10 + Math.floor((i + 1) / 5) * 5;
  }
  return score;
}

const BLOCKED_NAMES = new Set([
  'gäst', 'anonym', 'guest', 'anonymous', 'användarnamn', 'anvndarnamn', 'namn', 'test', 'user',
  'firefox', 'chrome', 'safari', 'edge', 'opera', 'brave', 'vivaldi', 'chromium',
]);

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

    // ── START ──
    if (action === "start") {
      const { username } = body;

      if (!username || typeof username !== "string" || username.trim().length === 0) {
        return jsonError("Missing or invalid username", 400);
      }

      const sanitized = username.trim().slice(0, 30).replace(/[^a-zA-Z0-9_åäöÅÄÖ -]/g, "");
      if (!sanitized || BLOCKED_NAMES.has(sanitized.toLowerCase())) {
        return jsonError("Invalid username", 400);
      }

      const { data, error } = await supabase
        .from("snake_sessions")
        .insert({ user_id: "00000000-0000-0000-0000-000000000000", username: sanitized })
        .select("id, session_token")
        .single();

      if (error) {
        console.error("Start session error:", error);
        return jsonError("Failed to create session", 500);
      }

      return jsonOk({ session_token: data.session_token });
    }

    // ── APPLE: log an apple pickup ──
    if (action === "apple") {
      const { session_token } = body;
      if (!session_token) return jsonError("Missing session_token", 400);

      const { data: session, error } = await supabase
        .from("snake_sessions")
        .select("id, is_valid, finished_at")
        .eq("session_token", session_token)
        .single();

      if (error || !session) return jsonError("Invalid session", 401);
      if (!session.is_valid) return jsonError("Session invalidated", 403);
      if (session.finished_at) return jsonError("Session already finished", 400);

      await supabase.from("snake_events").insert({
        session_id: session.id,
        event_type: "apple",
      });

      return jsonOk({ ok: true });
    }

    // ── FINISH ──
    if (action === "finish") {
      const { session_token } = body;
      if (!session_token) return jsonError("Missing session_token", 400);

      const { data: session, error: sessError } = await supabase
        .from("snake_sessions")
        .select("*")
        .eq("session_token", session_token)
        .single();

      if (sessError || !session) return jsonError("Invalid session", 401);
      if (!session.is_valid) return jsonError("Session invalidated", 403);
      if (session.finished_at) return jsonError("Session already finished", 400);

      const { data: events } = await supabase
        .from("snake_events")
        .select("*")
        .eq("session_id", session.id)
        .order("event_at", { ascending: true });

      const appleEvents = (events || []).filter((e: any) => e.event_type === "apple");

      let invalidReason: string | null = null;

      // 1. Min time between apples
      if (appleEvents.length > 1) {
        for (let i = 1; i < appleEvents.length; i++) {
          const diff = new Date(appleEvents[i].event_at).getTime() - new Date(appleEvents[i - 1].event_at).getTime();
          if (diff < MIN_MS_BETWEEN_APPLES) {
            invalidReason = `Apples too fast: ${diff}ms between apple ${i - 1} and ${i}`;
            break;
          }
        }
      }

      // 2. Min game duration
      if (!invalidReason && appleEvents.length > 0) {
        const duration = new Date(appleEvents[appleEvents.length - 1].event_at).getTime() - new Date(session.started_at).getTime();
        if (duration < MIN_GAME_DURATION_MS) {
          invalidReason = `Game too fast: ${duration}ms`;
        }
      }

      // 3. Sanity cap on apples (20x20 grid, snake can't eat more than ~380 apples)
      if (!invalidReason && appleEvents.length > 380) {
        invalidReason = `Unrealistic apple count: ${appleEvents.length}`;
      }

      const score = calcScore(appleEvents);
      const timeSec = appleEvents.length > 0
        ? Math.floor((new Date(appleEvents[appleEvents.length - 1].event_at).getTime() - new Date(session.started_at).getTime()) / 1000)
        : 0;

      await supabase.from("snake_sessions").update({
        finished_at: new Date().toISOString(),
        is_valid: !invalidReason,
        score,
      }).eq("id", session.id);

      if (invalidReason) {
        console.warn(`Session ${session.id} invalidated: ${invalidReason}`);
        return jsonOk({ valid: false, score: 0 });
      }

      // Check if better score already exists
      const { data: existing } = await supabase
        .from("snake_highscores")
        .select("id, score")
        .eq("username", session.username)
        .order("score", { ascending: false })
        .limit(1);

      if (!existing || existing.length === 0 || existing[0].score < score) {
        await supabase.from("snake_highscores").insert({
          user_id: "00000000-0000-0000-0000-000000000000",
          username: session.username,
          avatar_url: null,
          score,
          apples_eaten: appleEvents.length,
          time_seconds: timeSec,
        });
      }

      return jsonOk({ valid: true, score, apples: appleEvents.length, time_seconds: timeSec });
    }

    return jsonError("Unknown action", 400);
  } catch (error) {
    console.error("Snake game error:", error);
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
