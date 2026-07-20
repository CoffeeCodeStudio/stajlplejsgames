# Changelog

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
