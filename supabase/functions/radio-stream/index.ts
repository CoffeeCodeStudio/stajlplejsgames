import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
};

// Radio station stream URLs - whitelist only
const RADIO_STREAMS: Record<string, string> = {
  "p3": "https://sverigesradio.se/topsy/direkt/164-hi.mp3",
  "p1": "https://sverigesradio.se/topsy/direkt/132-hi.mp3",
  "p2": "https://sverigesradio.se/topsy/direkt/2562-hi.mp3",
  "p4stockholm": "https://sverigesradio.se/topsy/direkt/701-hi.mp3",
  "dingatastockholm": "https://sverigesradio.se/topsy/direkt/2576-hi.mp3",
};

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, limit: number = 5): boolean {
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

  // SECURITY: Rate limiting - 5 stream requests per minute per IP (streams are long-lived)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp, 5)) {
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
    const stationId = url.searchParams.get("station");

    // SECURITY: Validate station ID is in whitelist
    if (!stationId || !RADIO_STREAMS[stationId]) {
      return new Response(
        JSON.stringify({ 
          error: "Station not found",
          available: Object.keys(RADIO_STREAMS),
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 404 
        }
      );
    }

    const streamUrl = RADIO_STREAMS[stationId];
    
    // Fetch the audio stream
    const response = await fetch(streamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "audio/mpeg, audio/*",
        ...(req.headers.get("range") ? { "Range": req.headers.get("range")! } : {}),
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Stream returned ${response.status}` }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: response.status 
        }
      );
    }

    // Stream the response
    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", response.headers.get("Content-Type") || "audio/mpeg");
    
    if (response.headers.get("Content-Length")) {
      headers.set("Content-Length", response.headers.get("Content-Length")!);
    }
    if (response.headers.get("Content-Range")) {
      headers.set("Content-Range", response.headers.get("Content-Range")!);
    }
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "no-cache, no-store");

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("Stream error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch stream" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
