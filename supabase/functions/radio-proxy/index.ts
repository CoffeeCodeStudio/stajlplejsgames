import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Radio station configurations with stream URLs
const RADIO_STATIONS: Record<string, { streamUrl: string; metadataUrl?: string }> = {
  "p3": {
    streamUrl: "https://sverigesradio.se/topsy/direkt/164-hi.mp3",
    metadataUrl: "https://api.sr.se/api/v2/channels/164?format=json",
  },
  "p1": {
    streamUrl: "https://sverigesradio.se/topsy/direkt/132-hi.mp3",
    metadataUrl: "https://api.sr.se/api/v2/channels/132?format=json",
  },
  "p2": {
    streamUrl: "https://sverigesradio.se/topsy/direkt/2562-hi.mp3",
    metadataUrl: "https://api.sr.se/api/v2/channels/2562?format=json",
  },
  "p4stockholm": {
    streamUrl: "https://sverigesradio.se/topsy/direkt/701-hi.mp3",
    metadataUrl: "https://api.sr.se/api/v2/channels/701?format=json",
  },
  "dingatastockholm": {
    streamUrl: "https://sverigesradio.se/topsy/direkt/2576-hi.mp3",
    metadataUrl: "https://api.sr.se/api/v2/channels/2576?format=json",
  },
};

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, limit: number = 20): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= limit) return false;
  record.count++;
  return true;
}

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (now > value.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 120000);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Validate API key to prevent unauthorized proxy abuse
  const apikey = req.headers.get("apikey");
  const expectedKey = Deno.env.get("SUPABASE_ANON_KEY");
  
  if (!apikey || apikey !== expectedKey) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 401 
      }
    );
  }

  // SECURITY: Rate limiting - 20 requests per minute per IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp, 20)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      }
    );
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const stationId = url.searchParams.get("station");

    // SECURITY: Validate station ID is in whitelist
    if (stationId && !RADIO_STATIONS[stationId]) {
      return new Response(
        JSON.stringify({ error: "Invalid station" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (action === "metadata" && stationId) {
      // Fetch metadata for Sveriges Radio stations
      const station = RADIO_STATIONS[stationId];
      if (!station?.metadataUrl) {
        return new Response(
          JSON.stringify({ error: "No metadata available for this station" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      const response = await fetch(station.metadataUrl);
      const data = await response.json();

      const channel = data.channel;
      const currentSchedule = channel?.currentscheduledepisode;

      // Also try to get current song from song list
      let nowPlaying = null;
      if (channel?.siteurl) {
        try {
          const channelId = stationId === "p3" ? 164 : stationId === "p1" ? 132 : stationId === "p2" ? 2562 : stationId === "p4stockholm" ? 701 : 2576;
          const songListUrl = `https://api.sr.se/api/v2/playlists/rightnow?channelid=${channelId}&format=json`;
          const songResponse = await fetch(songListUrl);
          const songData = await songResponse.json();
          
          if (songData.playlist?.song) {
            nowPlaying = {
              title: songData.playlist.song.title,
              artist: songData.playlist.song.artist,
              albumArt: songData.playlist.song.albumarturl,
            };
          }
        } catch (e) {
          console.log("Could not fetch song info:", e);
        }
      }

      return new Response(
        JSON.stringify({
          name: channel?.name,
          tagline: channel?.tagline,
          currentShow: currentSchedule?.title,
          currentShowDescription: currentSchedule?.description,
          nowPlaying,
          image: channel?.image,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "stream" && stationId) {
      const station = RADIO_STATIONS[stationId];
      if (!station) {
        return new Response(
          JSON.stringify({ error: "Station not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      return new Response(
        JSON.stringify({ streamUrl: station.streamUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List all available stations
    if (action === "list") {
      return new Response(
        JSON.stringify({
          stations: Object.keys(RADIO_STATIONS).map(id => ({
            id,
            hasMetadata: !!RADIO_STATIONS[id].metadataUrl,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use ?action=metadata&station=p3 or ?action=stream&station=p3" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
