# Changelog

## 2026-07-26 — Snake tappade varannan sparning (React-closure), sessionstoken-race, retro-scrollbar + feed-layout

**Bakgrund:** Trots fixarna 07-21 rapporterades återigen att en lång Snake-omgång (58 äpplen) inte sparades. Den här gången satt felet i klienten, inte i edge-funktionen eller databasen — sparkedjan från 07-21 var hel hela tiden.

**Bugg 5 — `scoreSaved` som React-state gav en closure-bugg som tappade varannan omgång:** `saveScore()` i `SnakeGame.tsx` vaktade mot dubbelsparning med `if (scoreSaved) return;` där `scoreSaved` var React-state och låg i hookens dependency-lista. Spelloopen startas med `setInterval(() => tick(), ...)` och fångar den `tick` som fanns vid *det* renderet; `tick` fångar i sin tur `endGame` → `saveScore`. Loopen schemalägger dessutom om sig själv mot samma frusna referens vid varje äpple.

Kedjan: när spel 1 sparas anropas `setScoreSaved(true)`, vilket skapar ett nytt `saveScore` med `scoreSaved === true` → nytt `endGame` → nytt `tick` → nytt `startGame`. Knappen "🔄 Igen" pekar nu på det nya `startGame`, som mycket riktigt kör `setScoreSaved(false)` — men dess `setTimeout` startar loopen mot den **gamla** `tick`, som fortfarande bär `saveScore` med `scoreSaved === true`. Spel 2 kör alltså hela vägen på en closure där guarden redan är sann, och `saveScore` returnerar direkt utan att skicka `finish`.

Eftersom den tidiga returen ligger *före* `setScoreSaved(true)` förblir state `false` efteråt, så spel 3 sparar korrekt, spel 4 misslyckas, och så vidare — **varannan omgång tappades**. Det förklarar både varför felet såg intermittent ut och varför just långa omgångar drabbades: en 58-äpplens-runda är sällan den första man spelar. Den tidiga returen hoppade dessutom över `localStorage`-uppdateringen, så inte ens det lokala rekordet skrevs.

Fix (`SnakeGame.tsx`): guarden flyttad till `scoreSavedRef` (ref, inte state) så att den alltid speglar nuläget oavsett closure. `saveScore` tappar därmed `scoreSaved` ur sina deps och slutar återskapas. Dessutom infört `tickRef`, som pekas om vid varje render, så att båda `setInterval` kör `tickRef.current()` och loopen aldrig kan fastna i en gammal `tick`. Det senare rättar på köpet att `endGame` läste ett fruset `highScore` vid konfetti-/rekordjämförelsen.

**Bugg 6 — sent `start`-svar kunde skriva över sessionstoken vid snabb omstart:** `startGame()` nollställer `sessionTokenRef`, skjuter iväg `action: "start"` utan `await` och startar spelloopen efter 50ms oavsett om svaret hunnit fram. Klickar spelaren "🔄 Igen" innan svaret landat kan det gamla svarets `.then()` skriva över `sessionTokenRef` med föregående omgångs token. `apple`- och `finish`-anropen går då mot fel session — och eftersom den sessionen oftast redan är avslutad svarar servern `"Session already finished"`, varpå den pågående omgången aldrig sparas. Fix: `gameGenerationRef` räknas upp vid varje `startGame()`, och `.then()` sätter bara token om generationen fortfarande stämmer.

**Bugg 7 (mindre) — `snake_sessions` saknade äppelantal:** sessionsraden lagrade slutpoängen men inte hur många äpplen som gav den, så en session gick inte att stämma av mot sin egen händelselogg utan att fråga `snake_events` separat. `snake_highscores` hade redan `apples_eaten`. Ny kolumn `apples_eaten integer` i `snake_sessions` (nullable utan default — äldre rader har okänt antal och ska inte påstå 0), och `snake-game`s `finish` skriver nu `appleEvents.length` dit. Skrivs även när omgången underkänts, så att en avvisad session går att felsöka i efterhand.

**Felspår som inte var orsaken (dokumenterat för nästa gång):** Felsökningen började med slutsatsen att `snake_events` saknade kolumnen `event_type`, vilket skulle ha gjort att varje äpple-insert misslyckades tyst och `finish` alltid räknade 0 äpplen. En migration skrevs och kördes — **mot fel Supabase-projekt**. MCP-anslutningen i sessionen når bara `ygqxkgduqlcgjqtelnjv`, medan appen enligt `.env` använder `kmbpnkkhbfelvpqzpdxy` (och den här changeloggen nämner på 07-21 ett tredje ID, `ifcsoarihdrrlxylaydl`). Sessionsdatan som citerades som bevis kom alltså från fel databas. E2E-testet nedan visade sedan att `event_type` finns och fungerar i det skarpa projektet. Migrationen togs bort igen (commit `aba1ce0`). **Verifiera alltid projekt-ID mot `.env` innan slutsatser dras ur databasen.**

**UI — retro-scrollbar:** ny `.scrollbar-nostalgic` i `src/index.css` (10px bred, rak/pixlad utan rundade hörn, `#c0562a` thumb på `#2a1a0a` track, `#d4683a` vid hover) för att matcha stajlplejs.se. `scrollbar-width`/`scrollbar-color` ingår så att Firefox får stilen — `::-webkit-scrollbar` är Chromium/Safari-specifikt. Applicerad på spelvyn (`GamesSection`) och båda topplistorna (`SnakeGame`, `MemoryGame`).

**UI — aktivitetsfeedens rader spillde över panelen:** `.gs-badge` hade `white-space: nowrap` men saknade `flex-shrink: 0`, så badges trycktes ut förbi panelens högerkant; tidsstämplarna saknade nowrap och bröts över tre rader. Fix: poäng, tid och badge pinnade med `flex-shrink: 0`, användarnamnet trunkerar istället. Det räckte dock inte på radens ~240px — namnen blev oläsbara ("Ma…", och på ett par rader inget namn alls). Därför även: badgen för rank ≥ 4 ("Se topplistan") borttagen, eftersom den tog ~90px för att säga "inte på pallen", och tidsstämplarna förkortade till `nu`/`5m`/`3t`/`4d`. Död CSS `.gs-badge-near` städad.

**Nytt testskript:** `scripts/test-snake-long-session.mjs` (Node 18+, inga beroenden) spelar en full session mot den deployade edge-funktionen i mänskligt tempo — `start` → N × `apple` → `finish` — och jämför serverns poäng mot en lokal kopia av `calcScore()`. Kräver `--yes` eftersom den skriver en riktig rad i den publika topplistan.

**Verifierat:**
- E2E mot skarpa projektet: 70 äpplen på 101.9s → `{"valid":true,"score":3045,"apples":70}`, 0 misslyckade events. Bekräftar att edge-funktion, anti-fusk och `snake_highscores`-skrivning fungerar i produktion.
- `tsc --noEmit` och `vite build` rena.
- Feed-layouten kontrollerad i webbläsare på 1440px: inga rader spiller över panelkanten, namn som `Gti88`, `Queensyard` och `El-magnifico` visas i sin helhet.

**Kvarstår:**
- **Migrationen `003_add_snake_sessions_apples_eaten.sql` är inte körd mot `kmbpnkkhbfelvpqzpdxy`** — jag saknar åtkomst till projektet från den här sessionen. Måste köras **före** deploy av `snake-game`, annars kraschar `finish` med PGRST204 på okänd kolumn (samma felläge som `user_id` gav i `7fa4aee`).
- `snake-game` behöver deployas efter migrationen.
- Testraderna från E2E-körningarna ligger kvar överst på topplistan: `delete from snake_highscores where username = 'TestBot';` (två rader, 55p och 3045p).
- Verifiera i klienten efter deploy: spela **två** omgångar i rad via "🔄 Igen" och bekräfta att båda ger spartoasten — det är precis det Bugg 5 bröt.
- E2E-skriptet testar HTTP-protokollet, inte React-komponenten. Det hade **inte** fångat Bugg 5 eller 6. Ett komponenttest som spelar två omgångar i följd vore det som faktiskt skyddar mot regression.
- `MemoryGame.tsx` har samma mönster som Bugg 5 (state-baserad `scoreSaved`-guard i en `setInterval`-driven loop) — inte granskat, inget fall rapporterat.
- Appens bredd är fortfarande låst av `max-w-[500px]` i `Index.tsx`. Iframen på stajlplejs.se är enligt `README.md` `width="100%"`, så begränsningen är självpåtagen — men hur bred värdsidans kolumn faktiskt är är okänt.

---

## 2026-07-21 (2) — Fixade Memory-sessionsbugg (samma schema-drift som Snake) + Snake anti-fusk kasserade giltiga resultat

**Bakgrund:** Efter fixarna nedan (samma dag, tidigare på dagen) rapporterades ytterligare två separata sparproblem: Memory sparade fortfarande inte, och en specifik Snake-spelare (`MagniOperis`) fick sina resultat inte räknade trots att han åt äpplena live i spelet.

**Bugg 3 — Memory hade samma schema-drift som Snake:** `memory-game`-funktionens insert i `memory_sessions` saknade `user_id`, precis som `snake_sessions`-inserten gjorde innan Bugg 2 (nedan) fixades. Detta var faktiskt redan flaggat som "kvarstår" i föregående changelog-post men inte åtgärdat. Fix: samma placeholder-UUID tillagd i `memory_sessions`-inserten (`supabase/functions/memory-game/index.ts`).

**Bugg 4 — Snake anti-fusk kasserade giltiga snabba plockningar:** `snake-game`s validering krävde minst 200ms mellan *varje enskilt* äpple-event. Problemet: varje äpple-plockning skickas som en egen fire-and-forget HTTP-request, så servern mäter *ankomsttid* för requesten, inte klientens faktiska tick-tid. Nätverksjitter kunde därför göra att två helt legitima plockningar (klientens min-tick är 60ms) såg ut att komma nästan samtidigt till servern. Verifierat med SQL mot `snake_events`: `MagniOperis` två bästa körningar (1560p/47 äpplen och 1240p/32 äpplen) blev båda `is_valid = false` på grund av **en enda** avvikande lucka (34ms respektive 89ms) — resten av varje omgång låg på 600ms–15s mellan äpplen, dvs helt normalt spel.

Fix (`supabase/functions/snake-game/index.ts`): tog bort den känsliga per-par-kollen (hård 200ms-gräns på varje enskild lucka) och ersatte med två nivåer:
- `ABSOLUTE_MIN_MS_BETWEEN_APPLES = 15` — hård golv för en *enskild* lucka, fångar bara i praktiken samtidiga (dubblerade/scriptade) events.
- `MIN_MS_BETWEEN_APPLES = 200` — nu ett **snittkrav** över hela omgången (`total_span / (antal_äpplen - 1)`), tål enstaka jitter men stoppar fortfarande botar som håller orealistiskt tempo genom hela omgången.

**Manuell rättelse av redan förlorade resultat:** `MagniOperis` två felaktigt kasserade sessioner (`0988a360...` = 1560p, `8d02f87f...` = 1240p) hade aldrig nått `snake_highscores`. Poäng, äpplen och tid räknades fram direkt ur `snake_events` (samma formel som edge-funktionen använder) och infogades manuellt via SQL, med `created_at` satt till sessionens `finished_at` (inte tidpunkten för rättelsen). Sessionerna markerades även `is_valid = true` i efterhand.

**Kvarstår:**
- Verifiera i klienten efter deploy: spela ett Snake-parti med snabba plockningar i följd, bekräfta att resultatet sparas.
- `memory-game`s anti-fusk-koll (350ms hård per-par-gräns) har samma jitterrisk som Snake hade — inte omskriven till snitt-baserad koll än, eftersom inget konkret fall är rapporterat där ännu.
- Deploy krävs för båda funktionerna (`snake-game`, `memory-game`) — gjordes inte av mig, jag saknar deploy-behörighet till projektet `ifcsoarihdrrlxylaydl` från den här sessionen.

---

## 2026-07-21 — Fixade två separata buggar som hindrade Snake/Memory-highscore från att sparas

**Bakgrund:** Användare rapporterade att high score inte sparades i Snake. Felsökning visade två oberoende, staplade buggar i sparkedjan klient → edge-funktion → databas — bägge behövde fixas för att en runda faktiskt skulle sparas.

**Bugg 1 — 401 vid gatewayen (`verify_jwt: true`):** `snake-game`- och `memory-game`-funktionerna var deployade med `verify_jwt: true`, men klientkoden (`SnakeGame.tsx`/`MemoryGame.tsx`) skickar bara en `apikey`-header, ingen `Authorization: Bearer <JWT>`. Supabase's edge-gateway avvisar då varje anrop med 401 innan funktionskoden ens körs. Felet svaldes tyst av klientens `.catch(() => {})`, så `session_token` sattes aldrig och `saveScore()` avbröt tyst (`if (!sessionTokenRef.current) return`). Fix: `verify_jwt: false` för båda funktionerna — de hanterar redan sin egen auktorisering via session-token + service-role, precis som `bot-cron`/`auth-webhook` redan gör.

**Bugg 2 — 500 vid DB-inserten (schema-drift):** Efter 401-fixet gav `action: "start"` istället `500 Failed to create session`. Orsak: den skarpa `snake_sessions`-tabellen har driftat från `001_initial_schema.sql` och har idag en `user_id uuid NOT NULL`-kolumn utan default (plus `app`, `current_apple_x/y`, `grid_cols`/`grid_rows` som inte finns i migrationsfilen — sannolikt en delad/multi-app-tabell). `snake-game`-funktionens insert i `snake_sessions` satte aldrig `user_id`, till skillnad från dess insert i `snake_highscores` som redan skickade en placeholder-UUID. Fix: la till samma placeholder (`user_id: "00000000-0000-0000-0000-000000000000"`) i `snake_sessions`-inserten. `app`- och grid-kolumnerna lämnades orörda, de har fungerande defaults.

**Ändringar:**
- `supabase/functions/snake-game/index.ts`: `user_id`-placeholder tillagd i `snake_sessions`-inserten (action `start`).
- Deploy-config: `verify_jwt: false` satt för både `snake-game` (v112) och `memory-game` (v107) i Supabase-projektet.

**Verifierat:**
- `action: "start"` mot `snake-game` ger nu `200 OK` med giltig `session_token` (tidigare 401, sen 500).
- RLS-låsningen från 07-19 är fortfarande intakt — direkt anon-läsning mot `snake_sessions` nekas fortfarande.

**Kvarstår:**
- Verifiera i klienten: spela ett riktigt Snake-parti, bekräfta att "🏆 Ditt rekord har sparats!"-toasten visas och att poängen dyker upp i topplistan.
- `memory-game` fick bara 401-fixet (verify_jwt: false) — inte undersökt om samma typ av schema-drift (`user_id NOT NULL` utan placeholder) finns i `memory_sessions`.

---

## 2026-07-20 — Ny spelvy med aktivitetsfeed, personliga rekord + embed-spärr borttagen

**Ändringar:**
- `GamesSection.tsx` omgjord till tvåkolumnslayout: smal vänsterkolumn med kompakta spelkort (Memory/Snake/Scribble) + peek på öppen Scribble-lobby, bred högerkolumn med en aktivitetsfeed som hämtar senaste rekorden från `snake_highscores` och `memory_highscores`.
- Personligt rekord ("Ditt rekord: X p") visas under respektive spelkort, hämtat per `username` från highscore-tabellerna.
- Tre badge-typer i aktivitetsfeeden: 🥇 **Nytt rekord** (poäng > globalt rekord), 🤝 **Lika rekord** (poäng = globalt rekord exakt), ⚡ **Nära rekord** (poäng ≥ 85 % av rekordet). Max en badge per rad.
- Snake-canvasen är nu responsiv (`width: 100%`, `maxWidth` satt till den ursprungliga pixelstorleken, `aspectRatio: 1/1`) istället för fast 320×320px — skalar ner på smala mobilskärmar utan att tappa pixel-rendering. Touch-styrning (D-pad) och tangentbordsstyrning fanns redan och är oförändrade.
- **`useEmbedGuard` borttagen (returnerar alltid `true`)** — appen visas nu oavsett iframe/referrer/domän. Detta river upp iframe-spärren som lades till 2026-07-19 (se nedan). Säkerheten hanteras separat framöver enligt uttrycklig instruktion; det finns i nuläget **ingen** kontroll av var appen laddas in, bara av vem som får skriva highscores (se RLS/edge-functions från 07-19, som fortfarande gäller).

---

## 2026-07-19 — Iframe-spärr + stängde kvarvarande hål i Snake RLS-policyerna

**Bakgrund:** Snake-highscores gick att fuska med av vem som helst med länken till `stajlplejsgames.vercel.app`, eftersom (a) sidan gick att öppna och spela helt utanför StajlPlejs iframe, och (b) `snake_highscores` hade en öppen databas-policy (`WITH CHECK (true)` för anonym insert). En tidigare session (15 juli) byggde redan server-side anti-fusk för Snake (`snake-game` edge-funktionen, `snake_sessions`/`snake_events`) och migrerade till ett nytt Supabase-projekt efter att det gamla blev bannat — men konsolideringen till `001_initial_schema.sql` återinförde av misstag de öppna anon-policyerna på `snake_highscores`, `snake_sessions` och `snake_events`, vilket gjorde det möjligt att kringgå hela anti-fusk-logiken genom att skriva direkt mot de tabellerna via Supabase-API:et.

**Ändringar:**
- Ny hook `src/hooks/useEmbedGuard.ts` + spärr i `src/pages/Index.tsx`: appen visar bara spelen om sidan faktiskt är inbäddad som iframe med referrer från `stajlplejs.com` (bypassas i dev-läge).
- Ny migration `supabase/migrations/002_lock_down_snake_rls.sql`: tar bort de öppna anon-policyerna på `snake_highscores`, `snake_sessions` och `snake_events` och begränsar skrivåtkomst till `service_role` (edge-funktionen), i linje med hur `memory_*`-tabellerna redan är låsta.
- Körde motsvarande SQL manuellt i Supabase SQL Editor mot den skarpa databasen (CLI:t saknade behörighet för `db push`/`functions deploy` — kontot är Owner men projektet är Lovable-hanterat och nekar Management API-åtkomst).

**Kvarstår:**
- Verifiera i skarp miljö: spela ett riktigt Snake-parti, bekräfta att rekordet sparas, och att ett direkt API-anrop mot `snake_highscores`/`snake_sessions`/`snake_events` nekas.

---

## [Unreleased]

### Tillagt
- Server-side anti-cheat validering för Snake via ny Edge Function (`snake-game`)
- `snake_sessions` och `snake_events` tabeller för att logga spelhändelser
- `ARCHITECTURE.md` — fullständig dokumentation av systemarkitektur

### Ändrat
- Snake sparar inte längre highscore direkt till DB från klienten — all score-hantering sker nu server-side
- Migrationer konsoliderade från 53 filer till en enda `001_initial_schema.sql`

### Fixat
- Scores syntes inte — orsakades av att Supabase-projektet var bannat. Migrerat till nytt projekt med uppdaterade credentials.

---

## [1.1.0] — 2026-03

### Tillagt
- Server-side anti-cheat validering för Memory via Edge Function (`memory-game`)
- `memory_sessions` och `memory_events` tabeller
- Scribble: automatisk städning av inaktiva spelare (90s timeout)
- Scribble: heartbeat var 30:e sekund för att hålla spelare aktiva
- Scribble: host-transfer när lobby-skaparen lämnar
- Scribble: auto-städning av stale lobbys (30 min inaktivitet)

### Ändrat
- Scribble: round-robin ritarrotation baserad på `joined_at`
- Snake: filtrerar ut generiska användarnamn (gäst, anonym, etc.) från leaderboard

---

## [1.0.0] — 2026-01

### Tillagt
- Snake — single-player med canvas-rendering och lokal highscore
- Memory — single-player med tre svårighetsgrader (lätt/medium/svårt)
- Scribble — multiplayer rita-och-gissa med realtidsritning via Supabase Realtime
- Leaderboards för Snake och Memory i Supabase
- Användarnamn via `?usr=`-URL-parameter från stajlplejs.se
- Anonym gäst-identitet via localStorage UUID för Scribble
- Retro-design anpassad till StajlPlejs visuella stil
- Iframe-integration med stajlplejs.se
