import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch stats counts
    const [{ count: memberCount }, { count: msgCount }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("chat_messages").select("*", { count: "exact", head: true }),
    ]);

    // Fetch 10 most recent members (only public fields)
    const { data: recentMembers } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .order("last_seen", { ascending: false })
      .limit(10);

    return new Response(
      JSON.stringify({
        stats: {
          members: memberCount ?? 0,
          messages: msgCount ?? 0,
        },
        recentMembers: recentMembers ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
