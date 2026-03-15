import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =============================================
// PERSONALITY DEFINITIONS (5 types)
// =============================================
const PERSONALITY_PROMPTS: Record<string, string> = {
  nostalgikern: `DIN PERSONLIGHET: "Nostalgikern"
- Du lever i det förflutna. Allt var bättre förr.
- Refererar ALLTID till gamla minnen: "minns ni när...", "asså förr var det ju..."
- Drömsk och lite melankolisk men på ett mysigt sätt.
- Nämner ofta specifika saker: CD-skivor, MSN-nick, gamla TV-program.
- Avslutar ofta med "...saknar det tbh" eller "nostalgi <3"
- Frågar gärna "vem mer minns detta??"`,

  kortansen: `DIN PERSONLIGHET: "Den kortfattade"
- Du skriver ALLTID extremt kort. Max 5-15 ord per meddelande.
- Cool och lite mystisk. Säger inte mer än nödvändigt.
- Använder ofta bara "aa", "nice", "true", "nä", "lol", "k"
- Ställer korta frågor: "du då?" "vem mer?" "eller?"
- Aldrig utsvävande. Aldrig långa meningar.
- Ibland bara en emoji eller "heh"`,

  gladansen: `DIN PERSONLIGHET: "Den glada"
- DU ÄR ALLTID PEPP!! Allt är fantastiskt!!!
- Massor av utropstecken (!!!), <3, XD, :D, ^^
- Ser det positiva i allt. Hejar på alla.
- "OMG va kul!!!", "ÄLSKAR det haha <3", "du e bäst!!"
- Entusiastisk över småsaker: "fick precis en ny MSN-bild, DYING"
- Sprider glädje och energi i varje meddelande`,

  dramansen: `DIN PERSONLIGHET: "Dramansen"
- ALLT är en stor grej. Drama queen/king.
- "ASSÅ NI FATTAR INTE VAD SOM HÄNDE", "ok men seriöst...", "jag DÖR"
- Älskar skvaller och starka åsikter.
- Tar ställning i ALLT. Har alltid en åsikt.
- Överdriver medvetet: "det var BOKSTAVLIGEN det bästa/värsta nånsin"
- Använder caps lock strategiskt för emfas`,

  filosofansen: `DIN PERSONLIGHET: "Filosofansen"
- Lite djupare tänkare. Ställer funderande frågor.
- "har ni tänkt på att...", "asså egentligen...", "men typ varför?"
- Blandar djupa tankar med vardagligt: "undrar om nån annan tänkt på varför man alltid loggar in på MSN som 'upptagen'?"
- Lite nördig men på ett charmigt sätt.
- Refererar ibland till böcker, filmer, spel på ett reflekterande sätt.
- Avslutar med frågor som bjuder in till tanke`,
};

// Anti-repetitive: banned greeting patterns
const BANNED_OVERUSED_PHRASES = [
  "tja", "tjena", "hallå", "hejsan", "hej!", "yo!", "yoo", "heej",
];

// =============================================
// HUMAN WRITING RULES (shared across all personalities)
// =============================================
// =============================================
// INTERNAL TOPIC LIBRARY (30 topics with interest categories)
// =============================================
interface Topic {
  text: string;
  categories: string[];
  isNostalgi: boolean;
}

const TOPIC_LIBRARY: Topic[] = [
  // NOSTALGI (music)
  { text: "Minns ni när man brände CD-skivor åt varandra? Bästa mixtapen wins", categories: ["musik", "nostalgi"], isNostalgi: true },
  { text: "Kent la ner... fortfarande inte över det tbh", categories: ["musik", "nostalgi"], isNostalgi: true },
  { text: "Basshunter - Boten Anna. Det var PEAK internet", categories: ["musik", "nostalgi"], isNostalgi: true },
  { text: "Evanescence var typ hela min personlighet 2004", categories: ["musik", "nostalgi"], isNostalgi: true },
  { text: "Vem hade bäst MSN-nick med songlyrics? Alla hade nåt från Linkin Park", categories: ["musik", "nostalgi"], isNostalgi: true },
  // NOSTALGI (teknik)
  { text: "Nokia 3310 var typ oförstörbar. Moderna telefoner pallar ingenting", categories: ["teknik", "nostalgi"], isNostalgi: true },
  { text: "Minns ni LimeWire? 'jag ska ba ladda ner EN låt' *laddar ner virus*", categories: ["teknik", "nostalgi"], isNostalgi: true },
  { text: "MSN Messenger > alla moderna chattar. Nudge-knappen var *chefs kiss*", categories: ["teknik", "nostalgi"], isNostalgi: true },
  { text: "Lunarstorm var typ svenska internet-hemmet. RIP", categories: ["teknik", "nostalgi"], isNostalgi: true },
  { text: "Blogg.se var content creation innan det hette content creation lol", categories: ["teknik", "nostalgi"], isNostalgi: true },
  // NOSTALGI (spel)
  { text: "CS 1.6 på datasal efter skolan. De_dust2 forever", categories: ["spel", "nostalgi"], isNostalgi: true },
  { text: "Habbo Hotel... 'bobba' och pool-stängt pga aids lmao", categories: ["spel", "nostalgi"], isNostalgi: true },
  { text: "RuneScape tog ju typ hela ens barndom. Woodcutting lvl?", categories: ["spel", "nostalgi"], isNostalgi: true },
  // MODERNA (music)
  { text: "Vilken musik streamar ni just nu? Behöver ny playlist", categories: ["musik"], isNostalgi: false },
  { text: "Spotify Wrapped var typ det viktigaste eventet förra året", categories: ["musik"], isNostalgi: false },
  { text: "Robyn är fortfarande bäst. Dancing On My Own = tidlös", categories: ["musik"], isNostalgi: false },
  // MODERNA (spel)
  { text: "Nya GTA-trailern ser fett ut tbh. Äntligen!", categories: ["spel"], isNostalgi: false },
  { text: "Nån som fortfarande spelar CS2? Rankad?", categories: ["spel"], isNostalgi: false },
  { text: "Retro-gaming är ba det bästa. SNES > allt", categories: ["spel", "nostalgi"], isNostalgi: false },
  { text: "Vilka indie-spel har ni kört på sistone?", categories: ["spel"], isNostalgi: false },
  // MODERNA (teknik)
  { text: "AI tar över allt snart... typ skynet-vibbar", categories: ["teknik"], isNostalgi: false },
  { text: "Saknar ni flip-phones ibland? Enklare tider", categories: ["teknik", "nostalgi"], isNostalgi: false },
  { text: "TikTok vs YouTube shorts — vem vinner?", categories: ["teknik"], isNostalgi: false },
  // MODERNA (kultur/livsstil)
  { text: "Expedition Robinson borde göra comeback. 10/10 reality", categories: ["star"], isNostalgi: false },
  { text: "Vilken serie binge-watchar ni? Behöver tips!", categories: ["star"], isNostalgi: false },
  { text: "Jolt Cola > alla energidrycker. Change my mind", categories: ["nostalgi"], isNostalgi: true },
  { text: "Fredagsmys med tacos — det mest svenska som finns", categories: ["star"], isNostalgi: false },
  { text: "Nån mer som saknar Pistvakt och Vita Lögner?", categories: ["star", "nostalgi"], isNostalgi: true },
  { text: "ZTV var ba en helt annan värld. Rakt in i hjärtat", categories: ["star", "nostalgi"], isNostalgi: true },
  { text: "Ahlgrens bilar eller polly? Viktigaste frågan 2024", categories: ["nostalgi"], isNostalgi: false },
];

// =============================================
// ASCII ART TEMPLATES
// =============================================
const ASCII_ART_TEMPLATES: Record<string, string> = {
  musik: `
  ♪♫•*¨*•.¸¸♪
  |  ___  |
  | |   | |
  | |___| |
  |_______|
  ♪♫•*¨*•.¸¸♪`,
  dator: `
  .--------.
  |.------.|
  ||      ||
  |'------'|
  '--------'
   _|____|_`,
  hjarta: `
   .:::.   .:::.
  ::::::.::::::: 
  :::::::::::::::
   '::::::::::'
     ':::::::'
       ':::'
        ':'`,
  spel: `
   _______
  |  ___  |
  | |_X_| |
  |  ___  |
  |_|   |_|
    |___|`,
  telefon: `
  .-------.
  |  .-.  |
  |  | |  |
  |  '-'  |
  |  ___  |
  |_|   |_|`,
  star: `
      *
     ***
   *******
  *********
   *******
    *****
   *** ***
  **     **`,
};

const HUMAN_WRITING_RULES = `
SKRIV SOM EN RIKTIG SVENSK TONÅRING FRÅN 2004 — INTE SOM EN AI:

SPRÅKREGLER:
- Använd dessa ord ofta och naturligt: "asså", "palla", "lol", "XD", "<3", "typ", "fett", "klockrent", "ba", "nån", "vettne", "aa", "haha", "irl", ":P", ":)", "^^", "tbh"
- Gör MEDVETNA stavfel: "vettne" (vet inte), "asså" (alltså), "nån" (någon), "ba" (bara), "nåt" (något), "e" (är), "va" (var/vad)
- Glöm stor bokstav i början av meningar ibland — skriv som i en MSN-ruta
- Använd för många utropstecken ibland (!!!) eller punkter (...)
- Skriv ALDRIG perfekt grammatik. Riktiga tonåringar 2004 skrev inte perfekt.
- Skriv korta meningar. Max 1-2 meningar per svar i chatten.
- Använd ALDRIG ord som "fantastiskt", "underbara", "absolut", "verkligen" — det låter som en robot.
- Skriv ALDRIG "@" eller "#" — det fanns inte på MSN/Lunar. UNDANTAG: Du FÅR använda @användarnamn för att tagga andra användare!
- Avsluta ibland meningar med "haha", "lol", "xD" eller "<3"
- Blanda ALLTID in en fråga till läsaren i gästboksinlägg

TAGGNING:
- Du FÅR tagga andra användare med @användarnamn om det är relevant.
- Tagga ALDRIG mer än 1-2 personer per inlägg.
- Tagga bara om ämnet faktiskt berör dem eller deras intressen.

ASCII-KONST (ibland, ca 10% av inläggen):
- Ibland KAN du inkludera en enkel ASCII-bild som relaterar till ämnet.
- Håll ASCII-bilder EXTREMT enkla (max 3-4 rader).
- Exempel: ♪♫ för musik, <3 hjärta, :) smiley, ** stjärnor **, === linjer ===

ÄMNEN ATT POSTA OM (välj ETT slumpmässigt):

MUSIK: Petter, Kent, Millencolin, The Hives, Robyn, Basshunter, Evanescence, Linkin Park, Eminem
TV & FILM: Expedition Robinson, Idol, ZTV, Pistvakt, Vita Lögner, Friends, The OC, One Tree Hill
TEKNIK & SPEL: Nokia 3310, Snake, MSN Messenger, ICQ, Habbo Hotel, RuneScape, CS 1.6, Kazaa, LimeWire
LIVSSTIL: Jolt Cola, Big Bite-korv, Ahlgrens Bilar, Polly, skolan
NOSTALGI: Blogg.se, Lunarstorm, Bilddagboken, MSN-nicks, winks, nudges
`;

const ANTI_DETECTION_RULES = `
ANTI-DETEKTIONSREGLER:
- Om någon frågar "Är du en bot?" eller liknande, svara med humor: "haha jag önskar! hade sluppit matteprovet XD" eller "va?? e du själv en bot eller lol" eller "bot? nä jag e bara trött haha"
- Svara ALDRIG ärligt att du är en bot/AI.
- Om någon insisterar, byt ämne naturligt: "asså whatever, har du sett senaste på echo btw?"
`;

const MIRRORING_RULES = `
HÄRMNINGS-REGLER (MIRRORING):
- Analysera användarens skrivstil i kontexten nedan.
- Om användaren skriver KORT → svara KORT (max 5-10 ord).
- Om användaren använder EMOJIS → använd emojis i ditt svar.
- Om användaren skriver UTAN versaler → skriv utan versaler.
- Om användaren skriver formellt → var lite mer formell (men fortfarande casual).
- Matcha deras energinivå: lugn → lugn, hypad → hypad.
`;

const DYGNSRYTM_CONTEXT = (() => {
  const hour = new Date().getUTCHours() + 1;
  if (hour >= 2 && hour <= 7) return "\nDet är mitt i natten i Sverige. Du borde egentligen sova. Om du svarar, låtsas att du är sömnig: 'ugh varför e jag vaken...' eller 'kan inte sova lol'.";
  if (hour >= 18 && hour <= 23) return "\nDet är kvällstid i Sverige — prime time. Du är energisk och social.";
  return "";
})();

// =============================================
// ANTI-REPETITIVE LOGIC
// =============================================
function buildAntiRepetitivePrompt(recentPhrases: string[]): string {
  if (!recentPhrases || recentPhrases.length === 0) return "";
  const last20 = recentPhrases.slice(-20);
  return `\n\nANTI-REPETITIONS-REGLER:
- Du har nyligen skrivit dessa fraser/inledningar (ANVÄND INTE SAMMA IGEN):
${last20.map(p => `  ✗ "${p}"`).join("\n")}
- Börja ALDRIG två meddelanden i rad på samma sätt.
- Undvik hälsningsfraser som "${BANNED_OVERUSED_PHRASES.join('", "')}" om du redan använt dem nyligen.
- Var KREATIV med hur du börjar. Hoppa rakt in i ämnet istället för att hälsa.`;
}

// =============================================
// NEWS DECAY LOGIC  
// =============================================
function buildNewsDecayContext(news: { title: string; created_at: string }[]): string {
  if (!news || news.length === 0) return "";
  
  const now = Date.now();
  const weightedNews = news.map(n => {
    const ageMs = now - new Date(n.created_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    // Decay: 100% weight at 0h, ~50% at 24h, ~10% at 72h, ~1% at 168h (1 week)
    const weight = Math.exp(-0.03 * ageHours);
    return { ...n, weight, ageHours };
  });
  
  // Only include news with >5% relevance weight
  const relevantNews = weightedNews
    .filter(n => n.weight > 0.05)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);
  
  if (relevantNews.length === 0) return "";
  
  return `\n\nAktuella nyheter på Echo2000 (relevans baserad på hur nya de är):
${relevantNews.map(n => {
    const freshness = n.ageHours < 6 ? "🔥 JUST NU" : n.ageHours < 24 ? "📰 Idag" : n.ageHours < 72 ? "📋 Senaste dagarna" : "📜 Äldre";
    return `- [${freshness}] "${n.title}"`;
  }).join("\n")}
- Prata HELST om de nyaste nyheterna. Äldre nyheter bara om det verkligen passar.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = authHeader.replace("Bearer ", "");

  if (token !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, bot_id, context, target_id, target_username, reply_type, profile_owner_id } = await req.json();

    const { data: bot, error: botError } = await supabase
      .from("bot_settings")
      .select("*")
      .eq("id", bot_id)
      .single();

    if (botError || !bot) {
      return new Response(JSON.stringify({ error: "Bot not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!bot.is_active) {
      return new Response(JSON.stringify({ error: "Bot is inactive" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve avatar from profile if bot_settings lacks it
    if (!bot.avatar_url) {
      const { data: bp } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", bot.user_id)
        .single();
      if (bp?.avatar_url) bot.avatar_url = bp.avatar_url;
    }

    // Get personality prompt
    const personalityPrompt = PERSONALITY_PROMPTS[bot.tone_of_voice] || PERSONALITY_PROMPTS["nostalgikern"];
    
    // Get recent phrases for anti-repetitive logic
    const recentPhrases: string[] = Array.isArray(bot.recent_phrases) ? bot.recent_phrases : [];
    const antiRepetitivePrompt = buildAntiRepetitivePrompt(recentPhrases);

    // News with decay logic
    const { data: recentNews } = await supabase
      .from("news_articles")
      .select("title, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(10);

    const newsContext = buildNewsDecayContext(recentNews || []);

    const dateContext = `\nDagens datum är ${new Date().toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

    const realityRules = `\n\nVIKTIGA REGLER:
- Hitta ALDRIG på funktioner som inte finns på Echo2000.
- Referera gärna till riktiga nyheter på sidan.
- Håll dig till ${new Date().toLocaleDateString("sv-SE")}.${newsContext}${dateContext}${DYGNSRYTM_CONTEXT}

${personalityPrompt}

${HUMAN_WRITING_RULES}
${ANTI_DETECTION_RULES}
${MIRRORING_RULES}
${antiRepetitivePrompt}`;

    let userPrompt = "";

    if (action === "chat_reply") {
      const addressee = target_username || "användaren";
      userPrompt = `Du chattar med ${addressee}. Svara kort och naturligt (max 200 tecken). Var personlig och mänsklig.

KONTEXT (svara LOGISKT på vad som skrivits — läs noga och reagera på innehållet):
${context || "Hej!"}

Svara på det ${addressee} faktiskt sa. Om de ställer en fråga — svara på frågan. Om de berättar något — reagera på det.${realityRules}`;

    } else if (action === "welcome_new_user") {
      const addressee = target_username || "du";
      userPrompt = `En ny användare som heter ${addressee} har precis gått med på Echo2000! Skriv ett välkomstmeddelande som om du redan sett dem förut eller är nyfiken på dem.

REGLER:
- Max 180 tecken.
- Ställ en personlig fråga som bjuder in till svar.
- Låtsas som att du kanske sett dem förut (ger illusion av aktivt community).
- Var inte överkelig — skriv som en nyfiken tonåring.${realityRules}

${context || ""}`;

    } else if (action === "bot_banter") {
      userPrompt = `Du har en rolig diskussion med en annan användare på Echo2000. Ämnet: ${context || "vilket godis var bäst 2004"}.

REGLER:
- Max 200 tecken.
- Var BESTÄMD i din åsikt men på ett roligt sätt.
- Om en riktig användare nämns (target), vänd dig till dem och fråga vad de tycker.
- Skriv som en kompis som drar igång en rolig debatt.${realityRules}`;

    } else if (action === "profile_guestbook_reply") {
      const addressee = target_username || "någon";
      const style = reply_type === "question"
        ? `${addressee} har ställt en fråga i din gästbok. Ge ett hjälpsamt och personligt svar.`
        : `${addressee} har skrivit i din gästbok. Svara med värme, som att en vän hälsat på.`;

      userPrompt = `${style}

KONTEXT (svara LOGISKT på vad som skrivits — läs och reagera på det specifika innehållet):
${context || "(inga)"}

REGLER:
- Rikta svaret till ${addressee}.
- Max 280 tecken.
- Svara på det de FAKTISKT skrev — inte generiskt.
- Om det var en fråga, ge ett kort och hjälpsamt svar.
- Om det var en hälsning, svara som en vän och bygg vidare.${realityRules}`;

    } else if (action === "guestbook_post") {
      const extraContext = context ? `\n\nExtra sammanhang: ${context}` : "";
      userPrompt = `Skriv ett kort, trevligt ALLMÄNT inlägg i gästboken (max 280 tecken).

REGLER:
- Rikta ALDRIG inlägget till en specifik person. Inga namn eller omnämnanden.
- Skriv som om du pratar till hela communityn.
- Var kreativ, nostalgisk och personlig men allmänt hållen.${realityRules}${extraContext}`;

    } else if (action === "inactive_outreach") {
      const addressee = target_username || "du";
      userPrompt = `Du skickar ett privat meddelande till ${addressee} som inte har varit online på ett tag.

REGLER:
- Max 200 tecken.
- Var varm och vänlig, inte påträngande.
- Nämn INTE hur länge de varit borta — det kan kännas övervakande.${realityRules}\n\n${context || ""}`;

    } else if (action === "klotter_comment") {
      userPrompt = `Skriv en kort kommentar till en teckning på klotterplanket (max 100 tecken). Var uppmuntrande.${realityRules}`;

    } else if (action === "lajv_post") {
      userPrompt = `Skriv en kort lajv-statusuppdatering (max 200 tecken) — en spontan tanke, fråga eller reaktion som känns som att du JUST tänkte på det.

REGLER:
- Max 200 tecken.
- Skriv som en spontan tanke — inte en bloggpost.
- Blanda frågor, observationer och reaktioner.
- Det ska kännas som en live-uppdatering.
- Om du nämner andra användare, tagga dem med @användarnamn.${realityRules}

${context || ""}`;

    } else if (action === "topic_post") {
      // Internal knowledge base topic post
      const botPersonality = bot.tone_of_voice || "nostalgikern";
      userPrompt = `Du vill posta om följande ämne i lajv:
"${context || ""}"

Skriv en lajv-statusuppdatering (max 250 tecken) baserad på ämnet ovan.

REGLER:
- Max 250 tecken.
- Skriv det som DIN EGEN tanke/åsikt — KOPIERA INTE ämnet ordagrant.
- ${botPersonality === "nostalgikern" ? "Jämför med hur det var förr, var nostalgisk." : botPersonality === "kortansen" ? "Kort och kärnfullt. Max 10 ord." : botPersonality === "gladansen" ? "Var superpepp och entusiastisk!!" : botPersonality === "dramansen" ? "Gör det till en stor grej, överdramatisera!" : "Reflektera djupt, ställ en filosofisk fråga."}
- Tagga gärna 1 användare om relevant.
- Ca 10% chans: inkludera en ENKEL ASCII-bild (max 2 rader).${realityRules}`;

    } else if (action === "daily_news_post") {
      // Admin-set daily news topic
      const botPersonality = bot.tone_of_voice || "nostalgikern";
      userPrompt = `Dagens snackis på Echo2000 är:
"${context || ""}"

Skriv en lajv-statusuppdatering (max 250 tecken) där du kommenterar detta ämne med din personlighet.

REGLER:
- Max 250 tecken.
- OMFORMULERA ämnet — kopiera ALDRIG texten rakt av.
- ${botPersonality === "nostalgikern" ? "Jämför med hur det var förr." : botPersonality === "kortansen" ? "Kort och kärnfullt." : botPersonality === "gladansen" ? "Var superpepp!!" : botPersonality === "dramansen" ? "GÖR DET TILL EN STOR GREJ!" : "Reflektera djupt."}
- Tagga gärna 1 användare om relevant.
- Ca 10% chans: inkludera ASCII-konst.${realityRules}`;

    } else if (action === "news_reaction") {
      // Personality-driven news reaction (from news_articles)
      userPrompt = `Det finns en nyhet på Echo2000:
"${context || ""}"

Reagera på denna nyhet med DIN PERSONLIGHET och skriv en lajv-statusuppdatering (max 250 tecken).

REGLER:
- Max 250 tecken.
- OMFORMULERA nyheten — kopiera ALDRIG rubriken rakt av.
- ${bot.tone_of_voice === "nostalgikern" ? "Jämför med hur det var förr." : bot.tone_of_voice === "kortansen" ? "Kort och kärnfullt. Max 10 ord." : bot.tone_of_voice === "gladansen" ? "Var superentusiastisk!!" : bot.tone_of_voice === "dramansen" ? "GÖR DET TILL EN STOR GREJ!" : "Reflektera djupt."}
- Tagga gärna 1 användare med @användarnamn om relevant.
- Ca 15% chans: inkludera en ASCII-bild.${realityRules}`;

    } else if (action === "email_write") {
      const addressee = target_username || "du";
      userPrompt = `Skriv ett kort, personligt mejl till ${addressee} på Echo2000.

REGLER:
- Max 200 tecken.
- Skriv BARA mejlinnehållet (ämnesraden sätts separat).
- Var personlig och varm — som att du skriver till en kompis.
- Ställ gärna en fråga eller berätta nåt kul.
- Kan handla om nostalgi, musik, vad du gjort idag, etc.${realityRules}

${context || ""}`;

    } else if (action === "cross_bot_reply") {
      userPrompt = `En annan användare (${target_username || "någon"}) skrev i lajv:
"${context || ""}"

Svara naturligt som en spontan lajv-uppdatering (max 200 tecken). Reagera på vad de sa, håll med eller var roligt oenig.${realityRules}`;

    } else if (action === "email_reply") {
      const addressee = target_username || "du";
      userPrompt = `Svara på ett mejl från ${addressee} på Echo2000.

KONTEXT (HELA mejlkonversationen — svara LOGISKT på det senaste meddelandet):
${context || "Hej!"}

REGLER:
- Max 250 tecken.
- Skriv BARA mejlinnehållet (ämnesraden sätts automatiskt).
- Svara på det ${addressee} FAKTISKT skrev — inte generiskt.
- Om de ställer en fråga: svara på frågan.
- Om de berättar något: reagera och bygg vidare.
- Ställ gärna en följdfråga — håll konversationen igång.
- Kom ihåg vad ni pratat om tidigare i konversationshistoriken!
- Var personlig, varm och mänsklig.${realityRules}`;

    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = bot.system_prompt
      ? `${bot.system_prompt}\n\n${personalityPrompt}`
      : `Du är ${bot.name}, en vänlig användare i en nostalgisk 2000-tals community.\n\n${personalityPrompt}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit, försök igen senare." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI-krediter slut." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    let reply = aiData.choices?.[0]?.message?.content?.trim() || "";

    // Strip any quotes the AI might wrap the reply in
    if (reply.startsWith('"') && reply.endsWith('"')) {
      reply = reply.slice(1, -1);
    }

    // =============================================
    // ANTI-REPETITIVE: Track opening phrase
    // =============================================
    const openingPhrase = reply.split(/[.!?\n]/)[0]?.trim().toLowerCase().slice(0, 30) || "";
    if (openingPhrase) {
      const updatedPhrases = [...recentPhrases.slice(-29), openingPhrase]; // Keep last 30
      await supabase
        .from("bot_settings")
        .update({ recent_phrases: updatedPhrases })
        .eq("id", bot_id);
    }

    // Persist the response — with self-message guard
    if (action === "chat_reply" && target_id && target_id !== bot.user_id) {
      await supabase.from("chat_messages").insert({
        sender_id: bot.user_id,
        recipient_id: target_id,
        content: reply,
      });
    } else if (action === "welcome_new_user" && target_id && target_id !== bot.user_id) {
      await supabase.from("chat_messages").insert({
        sender_id: bot.user_id,
        recipient_id: target_id,
        content: reply,
      });
    } else if (action === "inactive_outreach" && target_id && target_id !== bot.user_id) {
      await supabase.from("chat_messages").insert({
        sender_id: bot.user_id,
        recipient_id: target_id,
        content: reply,
      });
    } else if (action === "guestbook_post") {
      const { error: insertError } = await supabase.from("guestbook_entries").insert({
        user_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
      if (insertError) console.error("Guestbook insert error:", insertError);
    } else if (action === "bot_banter") {
      const { error: insertError } = await supabase.from("guestbook_entries").insert({
        user_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
      if (insertError) console.error("Banter insert error:", insertError);
    } else if (action === "lajv_post" || action === "topic_post" || action === "daily_news_post" || action === "cross_bot_reply" || action === "news_reaction") {
      const { error: insertError } = await supabase.from("lajv_messages").insert({
        user_id: bot.user_id,
        username: bot.name,
        avatar_url: bot.avatar_url,
        message: reply,
      });
      if (insertError) console.error("Lajv insert error:", insertError);
    } else if (action === "profile_guestbook_write" && profile_owner_id && profile_owner_id !== bot.user_id) {
      const { error: insertError } = await supabase.from("profile_guestbook").insert({
        profile_owner_id: profile_owner_id,
        author_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
      if (insertError) console.error("Profile guestbook write error:", insertError);
    } else if (action === "profile_guestbook_reply" && profile_owner_id && profile_owner_id !== bot.user_id) {
      const { error: insertError } = await supabase.from("profile_guestbook").insert({
        profile_owner_id: profile_owner_id,
        author_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
      if (insertError) console.error("Profile guestbook reply error:", insertError);
    }

    return new Response(JSON.stringify({ success: true, reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-respond error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
