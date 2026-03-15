import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =============================================
// HIGH-FREQUENCY BOT CRON — runs every minute
// Each bot has 5-10% chance per tick to act.
// Before acting, bots read recent context for relevance.
// Profile surfing happens every tick (2-3 bots).
// Status stars rotate based on recent activity.
// =============================================

const BOT_ACTION_CHANCE = 0.08; // 8% chance per bot per tick
const PROFILE_SURF_COUNT = 3; // Number of bots that surf profiles each tick

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
  const isScheduler = req.headers.get("x-supabase-scheduler") !== null;

  let isAdmin = false;
  if (!isServiceRole && !isScheduler && authHeader.startsWith("Bearer ")) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (user) {
      const { data: hasAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
      isAdmin = hasAdmin === true;
    }
  }

  if (!isServiceRole && !isScheduler && !isAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: bots, error: botsError } = await supabase
      .from("bot_settings")
      .select("*")
      .eq("is_active", true);

    if (botsError || !bots || bots.length === 0) {
      return new Response(JSON.stringify({ message: "No active bots found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, string[]> = {};
    const now = new Date();

    // =============================================
    // 1. FETCH RECENT CONTEXT (shared across all bots)
    // =============================================
    const recentContext = await fetchRecentContext(supabase, bots);

    // =============================================
    // 2. REACTIVE HANDLERS (always run — lightweight checks)
    // =============================================
    await handleAutoAcceptFriendRequests(supabase, supabaseUrl, bots, results);
    await handleLajvReplies(supabase, supabaseUrl, bots, results, recentContext);

    // Per-bot reactive: only check for unread messages (fast)
    for (const bot of bots) {
      results[bot.name as string] = results[bot.name as string] || [];
      const allowedContexts: string[] = (bot.allowed_contexts as string[]) || ["chat", "guestbook"];
      if (allowedContexts.includes("guestbook")) {
        await handleBotProfileGuestbookReplies(supabase, supabaseUrl, bot, results);
      }
      if (allowedContexts.includes("chat")) {
        await handleChatReplies(supabase, supabaseUrl, bot, results);
      }
      // Reactive email replies (check for unread emails)
      await handleEmailReplies(supabase, supabaseUrl, bot, bots, results);
    }

    // =============================================
    // 3. SMART ACTION SELECTION — each bot rolls independently
    // =============================================
    const PROACTIVE_ACTIVITIES = [
      { id: "lajv_post", weight: 25 },
      { id: "profile_guestbook_write", weight: 20 },
      { id: "topic_post", weight: 12 },
      { id: "email_write", weight: 12 },
      { id: "klotter_drawing", weight: 8 },
      { id: "snake_highscore", weight: 6 },
      { id: "memory_highscore", weight: 6 },
      { id: "good_vibes", weight: 5 },
      { id: "daily_news_post", weight: 5 },
      { id: "news_reaction", weight: 4 },
      { id: "cross_bot_reply", weight: 4 },
      { id: "bot_banter", weight: 3 },
      { id: "scribble", weight: 3 },
      { id: "guestbook_post", weight: 3 },
    ];

    const totalWeight = PROACTIVE_ACTIVITIES.reduce((s, a) => s + a.weight, 0);

    function pickWeightedActivity(): string {
      let r = Math.random() * totalWeight;
      for (const a of PROACTIVE_ACTIVITIES) {
        r -= a.weight;
        if (r <= 0) return a.id;
      }
      return PROACTIVE_ACTIVITIES[0].id;
    }

    // Each bot independently decides if it acts this tick
    const actingBots: Array<{ bot: Record<string, unknown>; activity: string }> = [];
    
    for (const bot of bots) {
      if (Math.random() < BOT_ACTION_CHANCE) {
        actingBots.push({ bot, activity: pickWeightedActivity() });
      }
    }

    // Execute actions for bots that rolled successfully
    for (const { bot, activity } of actingBots) {
      const botName = bot.name as string;
      results[botName] = results[botName] || [];

      try {
        // Set bot to "busy" (last_seen = now) while acting
        await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("user_id", bot.user_id as string);

        switch (activity) {
          case "lajv_post":
            await runSingleBotLajvPost(supabase, supabaseUrl, bot, results, recentContext);
            break;
          case "profile_guestbook_write":
            await runSingleBotGuestbookWrite(supabase, supabaseUrl, bot, bots, results, recentContext);
            break;
          case "topic_post":
            await handleTopicPosts(supabase, supabaseUrl, [bot], results, recentContext);
            break;
          case "email_write":
            await handleEmailWriting(supabase, supabaseUrl, bot, bots, results);
            break;
          case "klotter_drawing":
            await handleKlotterDrawing(supabase, [bot], results);
            break;
          case "snake_highscore":
            await handleSnakeHighscores(supabase, [bot], results);
            break;
          case "memory_highscore":
            await handleMemoryHighscores(supabase, [bot], results);
            break;
          case "good_vibes":
            await handleGoodVibes(supabase, [bot], results);
            break;
          case "daily_news_post":
            await handleDailyNewsPosts(supabase, supabaseUrl, [bot], results);
            break;
          case "news_reaction":
            await handleNewsReactions(supabase, supabaseUrl, [bot], results);
            break;
          case "cross_bot_reply":
            await handleCrossBotInteraction(supabase, supabaseUrl, [bot], results, recentContext);
            break;
          case "bot_banter":
            if (bots.length >= 2) await handleBotBanter(supabase, supabaseUrl, bots, results);
            break;
          case "scribble":
            await handleScribbleParticipation(supabase, [bot], results);
            break;
          case "guestbook_post": {
            const res = await callBotRespond(supabaseUrl, {
              action: "guestbook_post",
              bot_id: bot.id,
              context: recentContext.summary,
            });
            results[botName].push(`Guestbook: ${res.reply || res.error || "unknown"}`);
            break;
          }
        }
        results[botName].push(`[action: ${activity}]`);
      } catch (e) {
        results[botName].push(`${activity} error: ${(e as Error).message}`);
      }
    }

    // =============================================
    // 4. AUTONOMOUS PROFILE SURFING (every tick, 2-3 bots)
    // =============================================
    await handleAutonomousProfileSurfing(supabase, bots, results);

    // =============================================
    // 5. LAJV AUTO-FILL: if no lajv in 10 min, force a post
    // =============================================
    await handleLajvAutoFill(supabase, supabaseUrl, bots, results);

    // =============================================
    // 6. STATUS ROTATION — guarantee 50%+ bots online 24/7
    // Bots that just acted → online (last_seen = now)
    // Idle bots → controlled distribution ensuring minimum 50% online
    // Online = last_seen < 3 min (matches AWAY_TIMEOUT_MS in usePresence)
    // =============================================
    const activeBotNames = new Set(
      Object.entries(results)
        .filter(([_, msgs]) => msgs.some(m => !m.startsWith("[") && !m.includes("cooldown") && !m.includes("skipped") && !m.includes("Skipped")))
        .map(([name]) => name)
    );

    // Calculate how many bots need to be online (minimum 50%)
    const minOnlineCount = Math.ceil(bots.length * 0.5);
    const activeCount2 = activeBotNames.size;
    const idleBots = bots.filter(b => !activeBotNames.has(b.name as string));
    const additionalOnlineNeeded = Math.max(0, minOnlineCount - activeCount2);

    // Shuffle idle bots and assign guaranteed online slots
    const shuffledIdle = [...idleBots].sort(() => Math.random() - 0.5);
    const guaranteedOnline = new Set(shuffledIdle.slice(0, additionalOnlineNeeded).map(b => b.name as string));

    for (const bot of bots) {
      const botName = bot.name as string;
      const justActed = activeBotNames.has(botName);

      let lastSeen: string;

      if (justActed) {
        // Just acted → definitely online (0-30s ago)
        const offset = Math.floor(Math.random() * 30 * 1000);
        lastSeen = new Date(now.getTime() - offset).toISOString();
      } else if (guaranteedOnline.has(botName)) {
        // Guaranteed online slot — keep within 2 min (well under 3 min threshold)
        const offset = Math.floor(Math.random() * 2 * 60 * 1000);
        lastSeen = new Date(now.getTime() - offset).toISOString();
      } else {
        // Remaining idle bots — natural distribution (some online, some away)
        const statusRoll = Math.random();
        let offset: number;
        if (statusRoll < 0.40) {
          // Online: 0-2 min ago
          offset = Math.floor(Math.random() * 2 * 60 * 1000);
        } else if (statusRoll < 0.75) {
          // Away: 3-7 min ago
          offset = 3 * 60 * 1000 + Math.floor(Math.random() * 4 * 60 * 1000);
        } else {
          // Offline-ish: 8-20 min ago
          offset = 8 * 60 * 1000 + Math.floor(Math.random() * 12 * 60 * 1000);
        }
        lastSeen = new Date(now.getTime() - offset).toISOString();
      }

      await supabase.from("profiles").update({ last_seen: lastSeen }).eq("user_id", bot.user_id as string);
    }

    // =============================================
    // 7. NEW USER WELCOME (check every tick, lightweight)
    // =============================================
    await handleNewUserWelcome(supabase, supabaseUrl, bots, results);

    const activeCount = actingBots.length;
    console.log(`Bot tick: ${activeCount}/${bots.length} acted, ${activeBotNames.size} produced output`, JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, active: activeCount, total: bots.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-cron error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// =============================================
// REAL-TIME MEMORY: Fetch recent context before acting
// =============================================
interface RecentContext {
  recentLajv: Array<{ username: string; message: string; created_at: string }>;
  recentGuestbook: Array<{ author_name: string; message: string; profile_owner_id: string }>;
  recentVisitors: Array<{ visitor_id: string; profile_owner_id: string }>;
  summary: string;
}

async function fetchRecentContext(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[]
): Promise<RecentContext> {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const [lajvRes, gbRes, visitRes] = await Promise.all([
    supabase.from("lajv_messages").select("username, message, created_at")
      .gte("created_at", tenMinAgo).order("created_at", { ascending: false }).limit(10),
    supabase.from("profile_guestbook").select("author_name, message, profile_owner_id")
      .gte("created_at", tenMinAgo).order("created_at", { ascending: false }).limit(5),
    supabase.from("profile_visits").select("visitor_id, profile_owner_id")
      .gte("visited_at", tenMinAgo).order("visited_at", { ascending: false }).limit(10),
  ]);

  const recentLajv = lajvRes.data || [];
  const recentGuestbook = gbRes.data || [];
  const recentVisitors = visitRes.data || [];

  // Build a text summary for bots to use as context
  const lajvSummary = recentLajv.slice(0, 5).map(l => `${l.username}: "${l.message}"`).join("; ");
  const summary = lajvSummary
    ? `Senaste på Lajv: ${lajvSummary}`
    : "Lugnt just nu på Echo2000.";

  return { recentLajv, recentGuestbook, recentVisitors, summary };
}

// =============================================
// AUTONOMOUS PROFILE SURFING (triggers Ögat/Visitor Log)
// =============================================
async function handleAutonomousProfileSurfing(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    // Pick 2-3 random bots to surf profiles
    const surfCount = 2 + Math.floor(Math.random() * 2); // 2-3
    const shuffled = [...bots].sort(() => Math.random() - 0.5).slice(0, surfCount);

    // Get pool of real users + other bots to visit
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username")
      .eq("is_approved", true)
      .limit(50);

    if (!profiles || profiles.length === 0) return;

    for (const bot of shuffled) {
      const botName = bot.name as string;
      results[botName] = results[botName] || [];

      // Pick 1-2 random profiles to visit (not self)
      const targets = profiles
        .filter(p => p.user_id !== bot.user_id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 1 + Math.floor(Math.random() * 2));

      for (const target of targets) {
        const { error } = await supabase.from("profile_visits").upsert(
          {
            visitor_id: bot.user_id as string,
            profile_owner_id: target.user_id,
            visited_at: new Date().toISOString(),
          },
          { onConflict: "profile_owner_id,visitor_id" }
        );
        if (!error) results[botName].push(`👀 ${target.username}`);
      }
    }
  } catch (e) {
    console.error("Profile surfing error:", e);
  }
}

// =============================================
// Welcome new users within the last 30 minutes
// =============================================
async function handleNewUserWelcome(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: newUsers } = await supabase
      .from("profiles")
      .select("user_id, username")
      .gte("created_at", thirtyMinAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!newUsers || newUsers.length === 0) return;

    const botUserIds = new Set(bots.map(b => b.user_id as string));

    for (const newUser of newUsers) {
      if (botUserIds.has(newUser.user_id)) continue;

      const { data: existingWelcome } = await supabase
        .from("chat_messages")
        .select("id")
        .in("sender_id", Array.from(botUserIds))
        .eq("recipient_id", newUser.user_id)
        .limit(1);

      if (existingWelcome && existingWelcome.length > 0) continue;

      const welcomeBot = bots[Math.floor(Math.random() * bots.length)];
      const botName = welcomeBot.name as string;
      results[botName] = results[botName] || [];

      await broadcastTypingIndicator(supabase, welcomeBot.user_id as string, newUser.user_id);

      const res = await callBotRespond(supabaseUrl, {
        action: "welcome_new_user",
        bot_id: welcomeBot.id,
        target_id: newUser.user_id,
        target_username: newUser.username,
      });

      results[botName].push(`Welcome ${newUser.username}: ${res.reply || res.error || "unknown"}`);

      await supabase.from("friends").insert({
        user_id: welcomeBot.user_id as string,
        friend_id: newUser.user_id,
        status: "accepted",
        category: "Nätvän",
      }).then(() => {});
    }
  } catch (e) {
    console.error("New user welcome error:", e);
  }
}

// =============================================
// Inter-bot banter (fun debates)
// =============================================
const BANTER_TOPICS = [
  "vilket godis var bäst 2004? polly eller ahlgrens bilar?",
  "MSN eller ICQ — vad var egentligen bäst?",
  "vem minns när man brände CD-skivor med nero?",
  "nokia 3310 eller sony ericsson t610?",
  "habbo hotel vs runescape?",
  "limewire eller kazaa? virus-rouletten haha",
  "var the OC bättre än one tree hill?",
  "bästa MSN-nicket ni haft?",
  "linkin park eller evanescence?",
  "basshunter - boten anna.. klassiker eller cringe?",
  "kent vs håkan hellström?",
  "pistvakt eller vita lögner?",
  "jolt cola eller mountain dew?",
  "CS 1.6 dust2 eller de_nuke?",
  "blogg.se eller bilddagboken?",
];

async function handleBotBanter(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const shuffled = [...bots].sort(() => Math.random() - 0.5);
    const bot1 = shuffled[0];
    const bot2 = shuffled[1];
    if (!bot1 || !bot2) return;

    const topic = BANTER_TOPICS[Math.floor(Math.random() * BANTER_TOPICS.length)];

    const res1 = await callBotRespond(supabaseUrl, {
      action: "bot_banter",
      bot_id: bot1.id,
      context: `Starta en rolig debatt om: ${topic}. Du ska ta EN sida starkt.`,
    });

    results[bot1.name as string] = results[bot1.name as string] || [];
    results[bot1.name as string].push(`Banter: ${res1.reply || "unknown"}`);

    await new Promise(r => setTimeout(r, 2000));

    const res2 = await callBotRespond(supabaseUrl, {
      action: "bot_banter",
      bot_id: bot2.id,
      context: `Svara på denna åsikt om "${topic}": "${res1.reply}". Ta MOTSATT sida!`,
    });

    results[bot2.name as string] = results[bot2.name as string] || [];
    results[bot2.name as string].push(`Banter reply: ${res2.reply || "unknown"}`);
  } catch (e) {
    console.error("Bot banter error:", e);
  }
}

// =============================================
// Typing indicator broadcast
// =============================================
async function broadcastTypingIndicator(
  supabase: ReturnType<typeof createClient>,
  botUserId: string,
  targetUserId: string
) {
  try {
    const channelName = `chat-typing-${[botUserId, targetUserId].sort().join('-')}`;
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: botUserId, typing: true },
    });
    const delay = 3000 + Math.random() * 4000;
    await new Promise(r => setTimeout(r, delay));
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: botUserId, typing: false },
    });
  } catch (e) {
    console.error("Typing indicator error:", e);
  }
}

// =============================================
// Bot profile guestbook replies
// =============================================
async function handleBotProfileGuestbookReplies(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  results: Record<string, string[]>
): Promise<boolean> {
  try {
    const oneMinAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: recentEntries } = await supabase
      .from("profile_guestbook")
      .select("id, author_name, author_id, message, profile_owner_id, created_at")
      .eq("profile_owner_id", bot.user_id)
      .neq("author_id", bot.user_id)
      .gte("created_at", fifteenMinAgo)
      .lte("created_at", oneMinAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    const filteredEntries = recentEntries?.filter(e => e.author_id !== e.profile_owner_id) || [];
    if (filteredEntries.length === 0) return false;

    const targetEntry = filteredEntries[0];

    const { data: botRepliesAfter } = await supabase
      .from("profile_guestbook")
      .select("id")
      .eq("author_id", bot.user_id)
      .eq("profile_owner_id", targetEntry.author_id)
      .gte("created_at", targetEntry.created_at)
      .limit(1);

    if (botRepliesAfter && botRepliesAfter.length > 0) return false;

    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentBotPosts } = await supabase
      .from("profile_guestbook")
      .select("id")
      .eq("author_id", bot.user_id)
      .gte("created_at", tenMinAgo)
      .limit(1);

    if (recentBotPosts && recentBotPosts.length > 0) return false;

    const conversationContext = filteredEntries.slice(0, 10).reverse()
      .map(e => `- ${e.author_name}: "${e.message}"`).join("\n");

    const res = await callBotRespond(supabaseUrl, {
      action: "profile_guestbook_reply",
      bot_id: bot.id,
      context: conversationContext,
      target_username: targetEntry.author_name,
      target_id: targetEntry.author_id,
      profile_owner_id: targetEntry.author_id,
      reply_type: targetEntry.message.includes("?") ? "question" : "greeting",
    });

    results[bot.name as string].push(`GB reply to ${targetEntry.author_name}: ${res.reply || res.error || "unknown"}`);
    return true;
  } catch (e) {
    results[bot.name as string].push(`GB reply error: ${(e as Error).message}`);
    return false;
  }
}

// =============================================
// Chat replies with typing indicator
// =============================================
async function handleChatReplies(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  results: Record<string, string[]>
): Promise<boolean> {
  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: recentMsgs } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("recipient_id", bot.user_id)
      .eq("is_read", false)
      .lte("created_at", twoMinAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!recentMsgs || recentMsgs.length === 0) return false;

    // Random delay: 50% chance to skip if < 5 min old
    const oldestMsg = recentMsgs[recentMsgs.length - 1];
    const msgAgeMin = (Date.now() - new Date(oldestMsg.created_at).getTime()) / 60000;
    if (msgAgeMin < 5 && Math.random() < 0.5) {
      results[bot.name as string].push(`Chat delayed: ${msgAgeMin.toFixed(0)}min old`);
      return false;
    }

    const senderIds = [...new Set(recentMsgs.map(m => m.sender_id))].filter(id => id !== bot.user_id);
    if (senderIds.length === 0) return false;
    const chosenSenderId = senderIds[Math.floor(Math.random() * senderIds.length)];
    const senderMessages = recentMsgs.filter(m => m.sender_id === chosenSenderId);

    const { data: senderProfile } = await supabase
      .from("profiles").select("username").eq("user_id", chosenSenderId).single();
    const senderName = senderProfile?.username || "en användare";

    // Fetch full conversation history for context (last 20 messages between them)
    const { data: conversationHistory } = await supabase
      .from("chat_messages")
      .select("sender_id, content, created_at")
      .or(`and(sender_id.eq.${bot.user_id},recipient_id.eq.${chosenSenderId}),and(sender_id.eq.${chosenSenderId},recipient_id.eq.${bot.user_id})`)
      .order("created_at", { ascending: true })
      .limit(20);

    const historyContext = (conversationHistory || []).map(m => {
      const who = m.sender_id === bot.user_id ? (bot.name as string) : senderName;
      return `${who}: "${m.content}"`;
    }).join("\n");

    await broadcastTypingIndicator(supabase, bot.user_id as string, chosenSenderId);

    // Mark bot as busy while replying
    await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("user_id", bot.user_id as string);

    const res = await callBotRespond(supabaseUrl, {
      action: "chat_reply",
      bot_id: bot.id,
      context: `Du chattar med ${senderName}.\n\nKONVERSATIONSHISTORIK:\n${historyContext}`,
      target_id: chosenSenderId,
      target_username: senderName,
    });

    for (const m of senderMessages) {
      await supabase.from("chat_messages").update({ is_read: true }).eq("id", m.id);
    }

    results[bot.name as string].push(`Chat → ${senderName}: ${res.reply || res.error || "unknown"}`);
    return true;
  } catch (e) {
    results[bot.name as string].push(`Chat error: ${(e as Error).message}`);
    return false;
  }
}

// =============================================
// Lajv post with context awareness
// =============================================
async function runSingleBotLajvPost(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  results: Record<string, string[]>,
  context: RecentContext
) {
  const botName = bot.name as string;
  results[botName] = results[botName] || [];

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentLajv } = await supabase
    .from("lajv_messages").select("id").eq("user_id", bot.user_id).gte("created_at", fiveMinAgo).limit(1);

  if (recentLajv && recentLajv.length > 0) {
    results[botName].push("Lajv: cooldown");
    return;
  }

  // Use recent context for relevance
  const res = await callBotRespond(supabaseUrl, {
    action: "lajv_post",
    bot_id: bot.id,
    context: context.summary,
  });
  results[botName].push(`Lajv: ${res.reply || res.error || "unknown"}`);
}

// =============================================
// Guestbook write with context
// =============================================
async function runSingleBotGuestbookWrite(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>,
  context: RecentContext
) {
  const botName = bot.name as string;
  results[botName] = results[botName] || [];

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentWrites } = await supabase
    .from("profile_guestbook").select("id").eq("author_id", bot.user_id).gte("created_at", fiveMinAgo).limit(1);

  if (recentWrites && recentWrites.length > 0) {
    results[botName].push("GB write: cooldown");
    return;
  }

  let targetUserId: string | null = null;
  let targetUsername: string | null = null;

  if (Math.random() < 0.5) {
    const otherBots = bots.filter(b => (b.user_id as string) !== (bot.user_id as string));
    if (otherBots.length > 0) {
      const target = otherBots[Math.floor(Math.random() * otherBots.length)];
      targetUserId = target.user_id as string;
      targetUsername = target.name as string;
    }
  }

  if (!targetUserId) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeUsers } = await supabase
      .from("profiles").select("user_id, username")
      .eq("is_bot", false).eq("is_approved", true).gte("last_seen", oneWeekAgo).limit(20);

    if (!activeUsers || activeUsers.length === 0) return;
    const target = activeUsers[Math.floor(Math.random() * activeUsers.length)];
    targetUserId = target.user_id;
    targetUsername = target.username;
  }

  const { data: targetProfile } = await supabase
    .from("profiles").select("city, interests, listens_to").eq("user_id", targetUserId).single();

  const profileContext = targetProfile
    ? `${targetUsername} bor i ${targetProfile.city || "okänt"}. Intressen: ${targetProfile.interests || "okänt"}.`
    : "";

  const res = await callBotRespond(supabaseUrl, {
    action: "profile_guestbook_write",
    bot_id: bot.id,
    target_id: targetUserId,
    target_username: targetUsername,
    profile_owner_id: targetUserId,
    context: `${profileContext} ${context.summary}`,
  });

  results[botName].push(`GB → ${targetUsername}: ${res.reply || res.error || "unknown"}`);
}

// =============================================
// Email writing
// =============================================
const EMAIL_SUBJECTS = [
  "Hejhej! :)", "Läget?? 🙃", "Kolla in detta!", "Tänkte på dig",
  "Random fråga haha", "Sett nåt kul?", "Nostalgi-attack!!",
  "Hallå där! ✨", "Du missade detta", "Måste berätta!!",
  "Typ bästa grejen", "Saknar dig <3", "Haha kolla", "Fredag!! 🎉",
];

async function handleEmailWriting(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  const botName = bot.name as string;
  results[botName] = results[botName] || [];

  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentEmails } = await supabase
      .from("messages").select("id").eq("sender_id", bot.user_id).gte("created_at", thirtyMinAgo).limit(1);

    if (recentEmails && recentEmails.length > 0) {
      results[botName].push("Email: cooldown");
      return;
    }

    const { data: friends } = await supabase
      .from("friends").select("friend_id").eq("user_id", bot.user_id).eq("status", "accepted").limit(50);

    const botUserIds = new Set(bots.map(b => b.user_id as string));
    let targetUserId: string | null = null;
    let targetUsername: string | null = null;

    if (friends && friends.length > 0) {
      const humanFriends = friends.filter(f => !botUserIds.has(f.friend_id));
      const pool = humanFriends.length > 0 ? humanFriends : friends;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      targetUserId = chosen.friend_id;
    }

    if (!targetUserId) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activeUsers } = await supabase
        .from("profiles").select("user_id, username")
        .eq("is_bot", false).eq("is_approved", true).gte("last_seen", oneWeekAgo)
        .neq("user_id", bot.user_id as string).limit(20);

      if (!activeUsers || activeUsers.length === 0) return;
      const target = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      targetUserId = target.user_id;
      targetUsername = target.username;
    }

    if (!targetUsername) {
      const { data: p } = await supabase.from("profiles").select("username").eq("user_id", targetUserId).single();
      targetUsername = p?.username || "du";
    }

    const subject = EMAIL_SUBJECTS[Math.floor(Math.random() * EMAIL_SUBJECTS.length)];
    const res = await callBotRespond(supabaseUrl, {
      action: "email_write",
      bot_id: bot.id,
      context: `Skriv till ${targetUsername}`,
      target_id: targetUserId,
      target_username: targetUsername,
    });

    if (res.reply) {
      await supabase.from("messages").insert({
        sender_id: bot.user_id as string,
        recipient_id: targetUserId,
        subject,
        content: res.reply,
      });
      results[botName].push(`✉️ → ${targetUsername}: "${subject}"`);
    }
  } catch (e) {
    results[botName].push(`Email error: ${(e as Error).message}`);
  }
}

// =============================================
// Klotter drawing
// =============================================
const KLOTTER_COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FF69B4", "#98D8C8", "#F7DC6F", "#BB8FCE", "#82E0AA", "#F1948A"];

const KLOTTER_TEMPLATES: Array<{ comment: string; draw: (c: string) => string }> = [
  { comment: "haha :)", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><circle cx="200" cy="120" r="60" fill="none" stroke="${c}" stroke-width="3"/><circle cx="180" cy="105" r="5" fill="${c}"/><circle cx="220" cy="105" r="5" fill="${c}"/><path d="M175 140 Q200 165 225 140" fill="none" stroke="${c}" stroke-width="3"/></svg>` },
  { comment: "<3 <3 <3", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><path d="M200 230 C200 230 110 165 110 125 C110 85 145 70 175 85 C185 92 195 105 200 115 C205 105 215 92 225 85 C255 70 290 85 290 125 C290 165 200 230 200 230Z" fill="${c}" opacity="0.8"/></svg>` },
  { comment: "heja echo2000!!", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="150" text-anchor="middle" fill="${c}" font-size="36" font-family="Impact,sans-serif">ECHO2000</text><text x="200" y="190" text-anchor="middle" fill="${c}" font-size="18" opacity="0.7">★ Bäst på nätet ★</text></svg>` },
  { comment: "nostalgi lol", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="120" text-anchor="middle" fill="${c}" font-size="48">🎵</text><text x="200" y="180" text-anchor="middle" fill="${c}" font-size="24" font-family="Comic Sans MS,cursive">2004 forever</text></svg>` },
  { comment: "peace ✌️", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><circle cx="200" cy="150" r="80" fill="none" stroke="${c}" stroke-width="3"/><line x1="200" y1="70" x2="200" y2="230" stroke="${c}" stroke-width="3"/><line x1="200" y1="150" x2="144" y2="206" stroke="${c}" stroke-width="3"/><line x1="200" y1="150" x2="256" y2="206" stroke="${c}" stroke-width="3"/></svg>` },
  { comment: "sol o värme pls", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><circle cx="200" cy="150" r="50" fill="${c}" opacity="0.8"/><line x1="200" y1="80" x2="200" y2="50" stroke="${c}" stroke-width="3"/><line x1="200" y1="220" x2="200" y2="250" stroke="${c}" stroke-width="3"/><line x1="130" y1="150" x2="100" y2="150" stroke="${c}" stroke-width="3"/><line x1="270" y1="150" x2="300" y2="150" stroke="${c}" stroke-width="3"/></svg>` },
  { comment: "kent 4ever", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="100" text-anchor="middle" fill="${c}" font-size="42" font-family="Georgia,serif" font-style="italic">kent</text><text x="200" y="150" text-anchor="middle" fill="${c}" font-size="18" opacity="0.6">– bästa bandet –</text><text x="200" y="230" text-anchor="middle" fill="${c}" font-size="36">🎸</text></svg>` },
  { comment: "XD", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="180" text-anchor="middle" fill="${c}" font-size="120" font-family="Impact,sans-serif">XD</text></svg>` },
  { comment: "nån vaken?? xD", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="130" text-anchor="middle" fill="${c}" font-size="28" font-family="Comic Sans MS,cursive">nån vaken??</text><text x="200" y="200" text-anchor="middle" fill="${c}" font-size="48">😴</text></svg>` },
  { comment: "snake highscore!", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><rect x="100" y="140" width="20" height="20" fill="${c}"/><rect x="120" y="140" width="20" height="20" fill="${c}"/><rect x="140" y="140" width="20" height="20" fill="${c}"/><rect x="160" y="140" width="20" height="20" fill="${c}"/><rect x="160" y="120" width="20" height="20" fill="${c}"/><rect x="180" y="120" width="20" height="20" fill="${c}"/><circle cx="280" cy="140" r="8" fill="#FF4444"/><text x="200" y="220" text-anchor="middle" fill="${c}" font-size="16" opacity="0.7">nom nom 🐍</text></svg>` },
  { comment: "heja sverige!! 🇸🇪", draw: (_c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><rect x="100" y="80" width="200" height="140" fill="#005BAC" rx="4"/><rect x="100" y="135" width="200" height="30" fill="#FECC02"/><rect x="170" y="80" width="30" height="140" fill="#FECC02"/><text x="200" y="260" text-anchor="middle" fill="#FECC02" font-size="18">Heja Sverige!!</text></svg>` },
  { comment: "go go MSN!", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="100" text-anchor="middle" fill="${c}" font-size="32" font-family="Impact,sans-serif">MSN</text><text x="200" y="140" text-anchor="middle" fill="${c}" font-size="20">MESSENGER</text><text x="200" y="210" text-anchor="middle" fill="${c}" font-size="48">💬</text></svg>` },
];

async function handleKlotterDrawing(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const bot = bots[0];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase.from("klotter")
      .select("id").eq("user_id", bot.user_id).gte("created_at", twoHoursAgo).limit(1);
    if (recent && recent.length > 0) { results[botName].push("Klotter: cooldown"); return; }

    const template = KLOTTER_TEMPLATES[Math.floor(Math.random() * KLOTTER_TEMPLATES.length)];
    const color = KLOTTER_COLORS[Math.floor(Math.random() * KLOTTER_COLORS.length)];
    const svgContent = template.draw(color);
    const svgBytes = new TextEncoder().encode(svgContent);
    const filePath = `bot-drawings/${bot.user_id}/${Date.now()}.svg`;

    const { error: uploadError } = await supabase.storage
      .from("klotter").upload(filePath, svgBytes, { contentType: "image/svg+xml", upsert: true });
    if (uploadError) { results[botName].push(`Klotter error: ${uploadError.message}`); return; }

    const { data: urlData } = supabase.storage.from("klotter").getPublicUrl(filePath);

    let botAvatar = bot.avatar_url as string | null;
    if (!botAvatar) {
      const { data: p } = await supabase.from("profiles").select("avatar_url").eq("user_id", bot.user_id).single();
      botAvatar = p?.avatar_url || null;
    }

    const { error: insertError } = await supabase.from("klotter").insert({
      user_id: bot.user_id as string,
      image_url: urlData.publicUrl,
      comment: template.comment,
      author_name: botName,
      author_avatar: botAvatar,
    });

    if (!insertError) results[botName].push(`Klotter: "${template.comment}" 🎨`);
  } catch (e) { console.error("Klotter error:", e); }
}

// =============================================
// Scribble participation
// =============================================
const SCRIBBLE_WRONG_GUESSES = [
  "hund", "katt", "hus", "sol", "träd", "bil", "boll", "blomma", "fisk", "båt",
  "stol", "bord", "lampa", "bok", "penna", "äpple", "banan", "pizza", "glass",
  "gitarr", "hjärta", "stjärna", "moln", "regn", "snö", "eld", "vatten", "berg",
];

async function handleScribbleParticipation(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const { data: lobbies } = await supabase
      .from("scribble_lobbies").select("id, status, current_word, current_drawer_id")
      .in("status", ["waiting", "playing"]).order("created_at", { ascending: false }).limit(5);

    if (!lobbies || lobbies.length === 0) return;

    for (const lobby of lobbies) {
      if (lobby.status === "waiting") {
        const bot = bots[0];
        const botName = bot.name as string;
        results[botName] = results[botName] || [];

        const { data: existing } = await supabase.from("scribble_players")
          .select("id").eq("lobby_id", lobby.id).eq("user_id", bot.user_id).limit(1);
        if (existing && existing.length > 0) continue;

        let botAvatar = bot.avatar_url as string | null;
        if (!botAvatar) {
          const { data: p } = await supabase.from("profiles").select("avatar_url").eq("user_id", bot.user_id).single();
          botAvatar = p?.avatar_url || null;
        }

        const { error } = await supabase.from("scribble_players").insert({
          lobby_id: lobby.id,
          user_id: bot.user_id as string,
          username: botName,
          avatar_url: botAvatar,
        });
        if (!error) results[botName].push(`Joined scribble ${lobby.id.slice(0, 8)}`);
      }

      if (lobby.status === "playing" && lobby.current_word) {
        const { data: botPlayers } = await supabase.from("scribble_players")
          .select("user_id, username").eq("lobby_id", lobby.id)
          .in("user_id", bots.map(b => b.user_id as string));

        if (!botPlayers) continue;
        const guessers = botPlayers.filter(p => p.user_id !== lobby.current_drawer_id);

        for (const guesser of guessers) {
          const { data: correctGuess } = await supabase.from("scribble_guesses")
            .select("id").eq("lobby_id", lobby.id).eq("user_id", guesser.user_id).eq("is_correct", true).limit(1);
          if (correctGuess && correctGuess.length > 0) continue;

          const { data: prevGuesses } = await supabase.from("scribble_guesses")
            .select("id").eq("lobby_id", lobby.id).eq("user_id", guesser.user_id);
          const guessCount = prevGuesses?.length || 0;

          let guess: string;
          let isCorrect = false;

          if (guessCount >= 2 + Math.floor(Math.random() * 2)) {
            guess = lobby.current_word;
            isCorrect = true;
          } else {
            guess = SCRIBBLE_WRONG_GUESSES[Math.floor(Math.random() * SCRIBBLE_WRONG_GUESSES.length)];
          }

          const { error } = await supabase.from("scribble_guesses").insert({
            lobby_id: lobby.id,
            user_id: guesser.user_id,
            username: guesser.username,
            guess,
            is_correct: isCorrect,
          });

          results[guesser.username] = results[guesser.username] || [];
          if (!error) results[guesser.username].push(`Scribble: "${guess}" ${isCorrect ? "✅" : "❌"}`);
        }
      }
    }
  } catch (e) { console.error("Scribble error:", e); }
}

// =============================================
// Auto-accept friend requests
// =============================================
async function handleAutoAcceptFriendRequests(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const botUserIds = bots.map(b => b.user_id as string);
    const { data: pendingRequests } = await supabase
      .from("friends").select("id, user_id, friend_id")
      .in("friend_id", botUserIds).eq("status", "pending");

    if (!pendingRequests || pendingRequests.length === 0) return;

    for (const request of pendingRequests) {
      await supabase.from("friends").update({ status: "accepted" }).eq("id", request.id);

      const bot = bots.find(b => (b.user_id as string) === request.friend_id);
      if (!bot) continue;
      const botName = bot.name as string;
      results[botName] = results[botName] || [];

      const { data: senderProfile } = await supabase
        .from("profiles").select("username").eq("user_id", request.user_id).single();
      const senderName = senderProfile?.username || "Okänd";

      const res = await callBotRespond(supabaseUrl, {
        action: "friend_accept",
        bot_id: bot.id,
        target_id: request.user_id,
        target_username: senderName,
      });
      results[botName].push(`Accepted ${senderName} ✓`);
    }
  } catch (e) {
    console.error("Friend accept error:", e);
  }
}

// =============================================
// Lajv replies to human messages
// =============================================
async function handleLajvReplies(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>,
  context: RecentContext
) {
  try {
    const botUserIds = new Set(bots.map(b => b.user_id as string));
    const humanMessages = context.recentLajv.filter(m => {
      // Check if this username belongs to a bot
      return !bots.some(b => b.name === m.username);
    });
    if (humanMessages.length === 0) return;

    for (const msg of humanMessages) {
      const hasQuestion = msg.message.includes("?");
      const mentionsBot = bots.some(b => msg.message.toLowerCase().includes((b.name as string).toLowerCase()));
      if (!hasQuestion && !mentionsBot && Math.random() > 0.15) continue;

      let respondBot = bots[Math.floor(Math.random() * bots.length)];
      if (mentionsBot) {
        const mentioned = bots.find(b => msg.message.toLowerCase().includes((b.name as string).toLowerCase()));
        if (mentioned) respondBot = mentioned;
      }

      const botName = respondBot.name as string;
      results[botName] = results[botName] || [];

      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentBotLajv } = await supabase.from("lajv_messages")
        .select("id").eq("user_id", respondBot.user_id).gte("created_at", tenMinAgo).limit(1);
      if (recentBotLajv && recentBotLajv.length > 0) continue;

      const res = await callBotRespond(supabaseUrl, {
        action: "lajv_post",
        bot_id: respondBot.id,
        context: `${msg.username} sa: "${msg.message}". Svara naturligt.`,
      });
      results[botName].push(`Lajv reply: ${res.reply || res.error || "unknown"}`);
      break;
    }
  } catch (e) { console.error("Lajv replies error:", e); }
}

// =============================================
// Topic posts with context
// =============================================
const PERSONALITY_INTERESTS: Record<string, string[]> = {
  nostalgikern: ["msn", "limewire", "nokia", "kent", "cd-skivor", "ztv"],
  kortansen: ["snake", "cs", "habbo", "runescape", "flash-spel"],
  gladansen: ["robyn", "idol", "robinson", "basshunter", "glitter"],
  dramansen: ["the oc", "one tree hill", "blogg.se", "drama", "kärlekslåtar"],
  filosofansen: ["meningen med livet", "msn-nicks", "nostalgi", "internet", "identitet"],
};

const TOPIC_POOL = [
  "MSN-nick som var cringe", "Bästa flash-spelet nånsin", "Nokia vs Sony Ericsson",
  "Vad hände med blogg.se?", "Bästa svenska serien 2004", "Limewire-minnen",
  "CS 1.6 var bättre förr", "Habbo Hotel-nostalgi", "Idol 2005-finalen",
  "Robinson-favoriter", "Bästa kent-albumet", "MSN-winks och nudges",
  "Jolt Cola-tider", "RuneScape tog ju typ hela ens barndom",
  "Spotify Wrapped var typ det vi drömde om med CD-bränning",
];

async function handleTopicPosts(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>,
  context: RecentContext
) {
  try {
    const bot = bots[0];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentLajv } = await supabase.from("lajv_messages")
      .select("id").eq("user_id", bot.user_id).gte("created_at", fifteenMinAgo).limit(1);
    if (recentLajv && recentLajv.length > 0) {
      results[botName].push("Topic: cooldown");
      return;
    }

    const topic = TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)];
    const res = await callBotRespond(supabaseUrl, {
      action: "topic_post",
      bot_id: bot.id,
      context: `${topic}. ${context.summary}`,
    });
    results[botName].push(`Topic "${topic.slice(0, 30)}...": ${res.reply || res.error || "unknown"}`);
  } catch (e) { console.error("Topic posts error:", e); }
}

// =============================================
// Snake Highscores
// =============================================
async function handleSnakeHighscores(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const bot = bots[0];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data: recentScores } = await supabase.from("snake_highscores")
      .select("id").eq("user_id", bot.user_id).gte("created_at", threeHoursAgo).limit(1);

    if (recentScores && recentScores.length > 0) {
      results[botName].push("Snake: cooldown");
      return;
    }

    const roll = Math.random();
    let score: number, apples: number, time: number;
    if (roll < 0.60) { score = 5 + Math.floor(Math.random() * 25); }
    else if (roll < 0.85) { score = 30 + Math.floor(Math.random() * 50); }
    else if (roll < 0.95) { score = 80 + Math.floor(Math.random() * 70); }
    else { score = 150 + Math.floor(Math.random() * 100); }
    apples = Math.floor(score / 5);
    time = 10 + Math.floor(Math.random() * (score > 80 ? 180 : 60));

    let botAvatar = bot.avatar_url as string | null;
    if (!botAvatar) {
      const { data: p } = await supabase.from("profiles").select("avatar_url").eq("user_id", bot.user_id).single();
      botAvatar = p?.avatar_url || null;
    }

    const { error } = await supabase.from("snake_highscores").insert({
      user_id: bot.user_id as string,
      username: botName,
      avatar_url: botAvatar,
      score, apples_eaten: apples, time_seconds: time,
    });

    if (!error) results[botName].push(`Snake: ${score}pts (${apples}🍎, ${time}s) 🐍`);
  } catch (e) { console.error("Snake error:", e); }
}

// =============================================
// Memory Highscores
// =============================================
async function handleMemoryHighscores(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const bot = bots[0];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data: recentScores } = await supabase.from("memory_highscores")
      .select("id").eq("user_id", bot.user_id).gte("created_at", threeHoursAgo).limit(1);

    if (recentScores && recentScores.length > 0) {
      results[botName].push("Memory: cooldown");
      return;
    }

    // Difficulty distribution: 50% medium, 30% easy, 20% hard
    const diffRoll = Math.random();
    let difficulty: string;
    let pairCount: number;
    if (diffRoll < 0.30) {
      difficulty = "easy"; pairCount = 6;
    } else if (diffRoll < 0.80) {
      difficulty = "medium"; pairCount = 8;
    } else {
      difficulty = "hard"; pairCount = 12;
    }

    // Generate realistic scores based on difficulty
    const minMoves = pairCount * 2; // perfect game
    const maxExtraMoves = Math.floor(pairCount * 1.5);
    const moves = minMoves + Math.floor(Math.random() * maxExtraMoves);
    
    // Time: ~2-4 sec per move for easy, 3-6 for medium, 4-8 for hard
    const timePerMove = difficulty === "easy" ? 2 + Math.random() * 2 
                      : difficulty === "medium" ? 3 + Math.random() * 3 
                      : 4 + Math.random() * 4;
    const time = Math.floor(moves * timePerMove);
    
    // Score: higher for fewer moves and faster time
    const efficiency = minMoves / moves; // 1.0 = perfect
    const baseScore = Math.floor(pairCount * 100 * efficiency);
    const timeBonus = Math.max(0, Math.floor((300 - time) * 0.5));
    const score = baseScore + timeBonus;

    let botAvatar = bot.avatar_url as string | null;
    if (!botAvatar) {
      const { data: p } = await supabase.from("profiles").select("avatar_url").eq("user_id", bot.user_id).single();
      botAvatar = p?.avatar_url || null;
    }

    const { error } = await supabase.from("memory_highscores").insert({
      user_id: bot.user_id as string,
      username: botName,
      avatar_url: botAvatar,
      score, moves, time_seconds: time, difficulty,
    });

    if (!error) results[botName].push(`Memory (${difficulty}): ${score}pts (${moves} drag, ${time}s) 🧠`);
  } catch (e) { console.error("Memory error:", e); }
}


// =============================================
async function handleGoodVibes(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const bot = bots[0];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const targetTypes = ["guestbook", "lajv", "profile"];
    const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];
    let targetId: string | null = null;

    if (targetType === "guestbook") {
      const { data } = await supabase.from("guestbook_entries").select("id").order("created_at", { ascending: false }).limit(10);
      if (data && data.length > 0) targetId = data[Math.floor(Math.random() * data.length)].id;
    } else if (targetType === "lajv") {
      const { data } = await supabase.from("lajv_messages").select("id").order("created_at", { ascending: false }).limit(10);
      if (data && data.length > 0) targetId = data[Math.floor(Math.random() * data.length)].id;
    } else {
      const { data } = await supabase.from("profiles").select("user_id").eq("is_bot", false).limit(20);
      if (data && data.length > 0) targetId = data[Math.floor(Math.random() * data.length)].user_id;
    }
    if (!targetId) return;

    const { data: existing } = await supabase.from("good_vibes")
      .select("id").eq("giver_id", bot.user_id).eq("target_type", targetType).eq("target_id", targetId).limit(1);
    if (existing && existing.length > 0) return;

    const { error } = await supabase.from("good_vibes").insert({
      giver_id: bot.user_id as string,
      target_type: targetType,
      target_id: targetId,
    });
    if (!error) results[botName].push(`❤️ → ${targetType}:${targetId.slice(0, 8)}`);
  } catch (e) { console.error("Good vibes error:", e); }
}

// =============================================
// Profile visits
// =============================================
async function handleProfileVisits(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const bot = bots[0];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const { data: profiles } = await supabase
      .from("profiles").select("user_id, username")
      .neq("user_id", bot.user_id).limit(30);

    if (!profiles || profiles.length === 0) return;

    const targets = [...profiles].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
    for (const p of targets) {
      const { error } = await supabase.from("profile_visits").upsert(
        { visitor_id: bot.user_id as string, profile_owner_id: p.user_id, visited_at: new Date().toISOString() },
        { onConflict: "profile_owner_id,visitor_id" }
      );
      if (!error) results[botName].push(`👀 ${p.username}`);
    }
  } catch (e) { console.error("Profile visits error:", e); }
}

// =============================================
// Daily news posts
// =============================================
async function handleDailyNewsPosts(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const { data: activeNews } = await supabase
      .from("daily_news").select("*").eq("is_active", true)
      .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(3);

    if (!activeNews || activeNews.length === 0) return;

    const chosenNews = activeNews[Math.floor(Math.random() * activeNews.length)];
    const bot = bots[0];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const { data: recentLajv } = await supabase.from("lajv_messages")
      .select("id").eq("user_id", bot.user_id).gte("created_at", twentyMinAgo).limit(1);
    if (recentLajv && recentLajv.length > 0) return;

    const res = await callBotRespond(supabaseUrl, {
      action: "daily_news_post",
      bot_id: bot.id,
      context: chosenNews.content,
    });
    results[botName].push(`News lajv: ${res.reply || res.error || "unknown"}`);
  } catch (e) { console.error("Daily news error:", e); }
}

// =============================================
// News reactions
// =============================================
async function handleNewsReactions(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const { data: newsArticles } = await supabase
      .from("news_articles").select("id, title, content")
      .eq("is_published", true).order("created_at", { ascending: false }).limit(5);

    if (!newsArticles || newsArticles.length === 0) return;

    const article = newsArticles[Math.floor(Math.random() * newsArticles.length)];
    const bot = bots[0];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentLajv } = await supabase.from("lajv_messages")
      .select("id").eq("user_id", bot.user_id).gte("created_at", oneHourAgo).limit(2);
    if (recentLajv && recentLajv.length >= 2) return;

    const res = await callBotRespond(supabaseUrl, {
      action: "news_reaction",
      bot_id: bot.id,
      context: `${article.title}: ${article.content.substring(0, 200)}`,
    });
    results[botName].push(`News reaction: ${res.reply || res.error || "unknown"}`);
  } catch (e) { console.error("News reactions error:", e); }
}

// =============================================
// Cross-bot interaction with context
// =============================================
async function handleCrossBotInteraction(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>,
  context: RecentContext
) {
  try {
    const botUserIds = new Set(bots.map(b => b.user_id as string));
    const botPosts = context.recentLajv.filter(m => bots.some(b => b.name === m.username));
    if (botPosts.length === 0) return;

    const post = botPosts[Math.floor(Math.random() * botPosts.length)];
    if (Math.random() > 0.30) return;

    const posterBot = bots.find(b => b.name === post.username);
    if (!posterBot) return;

    const posterPersonality = posterBot.tone_of_voice as string || "nostalgikern";
    const posterInterests = PERSONALITY_INTERESTS[posterPersonality] || [];

    const candidateBots = bots.filter(b => {
      if (b.name === post.username) return false;
      const bp = b.tone_of_voice as string || "nostalgikern";
      const bi = PERSONALITY_INTERESTS[bp] || [];
      return bi.some(i => posterInterests.includes(i));
    });

    if (candidateBots.length === 0) return;

    const respondBot = candidateBots[Math.floor(Math.random() * candidateBots.length)];
    const botName = respondBot.name as string;
    results[botName] = results[botName] || [];

    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentReply } = await supabase.from("lajv_messages")
      .select("id").eq("user_id", respondBot.user_id).gte("created_at", fifteenMinAgo).limit(1);
    if (recentReply && recentReply.length > 0) return;

    const res = await callBotRespond(supabaseUrl, {
      action: "cross_bot_reply",
      bot_id: respondBot.id,
      context: post.message,
      target_username: post.username,
    });
    results[botName].push(`Cross-bot → ${post.username}: ${res.reply || res.error || "unknown"}`);
  } catch (e) { console.error("Cross-bot error:", e); }
}

// =============================================
// Lajv Auto-Fill
// =============================================
async function handleLajvAutoFill(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentLajv } = await supabase
      .from("lajv_messages").select("id").gte("created_at", tenMinAgo).limit(1);

    if (recentLajv && recentLajv.length > 0) return;

    const bot = bots[Math.floor(Math.random() * bots.length)];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const fillTopics = [
      "Tyst här... nån vaken?? 🌙",
      "Jag scrollar bara... typ dead internet vibes",
      "Minns ni flash-spel? Good times",
      "Ingen online?? Jag sitter här iaf lol",
      "Echo2000 > alla andra sidor. Just saying",
      "Nostalgi-tanke: MSN-ljud = dopamin",
      "Testar om nån ser det här... hallå?",
      "Borde sova men scrollar istället. Klassiker",
    ];
    const topic = fillTopics[Math.floor(Math.random() * fillTopics.length)];

    const res = await callBotRespond(supabaseUrl, {
      action: "topic_post",
      bot_id: bot.id,
      context: topic,
    });
    results[botName].push(`Auto-fill: ${res.reply || res.error || "unknown"}`);
  } catch (e) { console.error("Lajv auto-fill error:", e); }
}

// =============================================
// Email replies — reactive handler for unread emails
// =============================================
async function handleEmailReplies(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
): Promise<boolean> {
  try {
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    // Find unread emails sent TO this bot (at least 2 min old for natural delay)
    const { data: unreadEmails } = await supabase
      .from("messages")
      .select("*")
      .eq("recipient_id", bot.user_id)
      .eq("is_read", false)
      .eq("deleted_by_recipient", false)
      .lte("created_at", twoMinAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!unreadEmails || unreadEmails.length === 0) return false;

    // Random delay: 40% chance to skip if < 5 min old (human-like)
    const oldestEmail = unreadEmails[unreadEmails.length - 1];
    const emailAgeMin = (Date.now() - new Date(oldestEmail.created_at).getTime()) / 60000;
    if (emailAgeMin < 5 && Math.random() < 0.4) {
      results[botName].push(`Email reply delayed: ${emailAgeMin.toFixed(0)}min old`);
      return false;
    }

    // Pick one sender to reply to
    const botUserIds = new Set(bots.map(b => b.user_id as string));
    const senderIds = [...new Set(unreadEmails.map(m => m.sender_id))].filter(id => id !== bot.user_id);
    if (senderIds.length === 0) return false;

    // Prefer human senders
    const humanSenders = senderIds.filter(id => !botUserIds.has(id));
    const chosenSenderId = humanSenders.length > 0
      ? humanSenders[Math.floor(Math.random() * humanSenders.length)]
      : senderIds[Math.floor(Math.random() * senderIds.length)];

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from("profiles").select("username").eq("user_id", chosenSenderId).single();
    const senderName = senderProfile?.username || "en användare";

    // Fetch full email conversation history (last 10 emails between them)
    const { data: emailHistory } = await supabase
      .from("messages")
      .select("sender_id, subject, content, created_at")
      .or(`and(sender_id.eq.${bot.user_id},recipient_id.eq.${chosenSenderId}),and(sender_id.eq.${chosenSenderId},recipient_id.eq.${bot.user_id})`)
      .eq("deleted_by_sender", false)
      .eq("deleted_by_recipient", false)
      .order("created_at", { ascending: true })
      .limit(10);

    const historyContext = (emailHistory || []).map(m => {
      const who = m.sender_id === bot.user_id ? botName : senderName;
      return `${who} (ämne: "${m.subject}"): "${m.content}"`;
    }).join("\n");

    // Mark bot as busy
    await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("user_id", bot.user_id as string);

    // Get the latest unread email to reply to
    const latestEmail = unreadEmails.find(e => e.sender_id === chosenSenderId) || unreadEmails[0];
    const replySubject = latestEmail.subject.startsWith("Re: ") ? latestEmail.subject : `Re: ${latestEmail.subject}`;

    const res = await callBotRespond(supabaseUrl, {
      action: "email_reply",
      bot_id: bot.id,
      context: `Du svarar på ett mejl från ${senderName}.\n\nMEJLHISTORIK:\n${historyContext}\n\nSenaste mejlet: "${latestEmail.content}"`,
      target_id: chosenSenderId,
      target_username: senderName,
    });

    if (res.reply) {
      // Send the reply
      await supabase.from("messages").insert({
        sender_id: bot.user_id as string,
        recipient_id: chosenSenderId,
        subject: replySubject,
        content: res.reply,
      });

      // Mark original emails as read
      for (const email of unreadEmails.filter(e => e.sender_id === chosenSenderId)) {
        await supabase.from("messages").update({ is_read: true }).eq("id", email.id);
      }

      results[botName].push(`✉️ reply → ${senderName}: "${replySubject}"`);
    }

    return true;
  } catch (e) {
    results[bot.name as string].push(`Email reply error: ${(e as Error).message}`);
    return false;
  }
}

// =============================================
// Helper: call bot-respond edge function
// =============================================
async function callBotRespond(
  supabaseUrl: string,
  body: Record<string, unknown>
) {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(`${supabaseUrl}/functions/v1/bot-respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(body),
  });
  return await res.json();
}
