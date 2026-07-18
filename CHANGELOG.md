# Changelog

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
