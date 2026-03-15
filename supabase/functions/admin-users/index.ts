import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin using their JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await anonClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client bypasses rate limits and RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { action } = body;

    // Shared cascade delete helper
    const cascadeDeleteUser = async (userId: string) => {
      const tables = [
        { table: "guestbook_entries", col: "user_id" },
        { table: "profile_guestbook", col: "author_id" },
        { table: "profile_guestbook", col: "profile_owner_id" },
        { table: "klotter", col: "user_id" },
        { table: "messages", col: "sender_id" },
        { table: "messages", col: "recipient_id" },
        { table: "chat_messages", col: "sender_id" },
        { table: "chat_messages", col: "recipient_id" },
        { table: "friends", col: "user_id" },
        { table: "friends", col: "friend_id" },
        { table: "friend_votes", col: "voter_id" },
        { table: "friend_votes", col: "target_user_id" },
        { table: "good_vibes", col: "giver_id" },
        { table: "good_vibe_allowances", col: "user_id" },
        { table: "lajv_messages", col: "user_id" },
        { table: "profile_visits", col: "visitor_id" },
        { table: "profile_visits", col: "profile_owner_id" },
        { table: "avatar_uploads", col: "user_id" },
        { table: "snake_highscores", col: "user_id" },
        { table: "memory_highscores", col: "user_id" },
        { table: "call_participants", col: "user_id" },
        { table: "call_sessions", col: "caller_id" },
        { table: "scribble_guesses", col: "user_id" },
        { table: "scribble_players", col: "user_id" },
        { table: "scribble_lobbies", col: "creator_id" },
        { table: "bot_settings", col: "user_id" },
        { table: "user_roles", col: "user_id" },
        { table: "profiles", col: "user_id" },
      ];
      // Delete from all tables with user_id columns
      for (const { table, col } of tables) {
        const { error } = await adminClient.from(table).delete().eq(col, userId);
        if (error) {
          console.error(`Failed to delete from ${table}.${col}:`, error.message);
          // Continue – best effort cleanup
        }
      }
      // Finally delete from Supabase Auth
      const { error: authErr } = await adminClient.auth.admin.deleteUser(userId);
      if (authErr) {
        throw new Error(`Auth delete failed: ${authErr.message}`);
      }
    };

    switch (action) {
      case "approve_user": {
        const { user_id } = body;
        const { error } = await adminClient
          .from("profiles")
          .update({ is_approved: true })
          .eq("user_id", user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deny_user": {
        const { user_id } = body;
        await cascadeDeleteUser(user_id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_user": {
        const { email, password, username } = body;
        const { data, error } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username },
        });
        if (error) throw error;

        await adminClient
          .from("profiles")
          .update({ is_approved: true })
          .eq("user_id", data.user.id);
        await adminClient
          .from("user_roles")
          .insert({ user_id: data.user.id, role: "user" });

        return new Response(
          JSON.stringify({ success: true, user_id: data.user.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_email": {
        const { user_id, new_email } = body;
        const { error } = await adminClient.auth.admin.updateUserById(user_id, {
          email: new_email,
          email_confirm: true,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_password": {
        const { user_id, new_password } = body;
        const { error } = await adminClient.auth.admin.updateUserById(user_id, {
          password: new_password,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_pending": {
        const { data, error } = await adminClient
          .from("profiles")
          .select("id, username, user_id, created_at, avatar_url, is_approved")
          .eq("is_approved", false)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return new Response(JSON.stringify({ users: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        const { user_id } = body;
        await cascadeDeleteUser(user_id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("admin-users error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
