# Changelog

## 2026-07-19 — Låst ner fusk i Snake-highscores

**Problem:** Vem som helst med länken till `stajlplejsgames.vercel.app` kunde spela spelen direkt (utanför StajlPlejs iframe) och sätta rekord. Snake-spelets highscore-tabell hade dessutom en helt öppen databas-policy (`WITH CHECK (true)` för anonym insert) som gjorde det möjligt att skriva in vilket poäng som helst direkt mot Supabase-API:et, utan att ens spela.

**Ändringar:**
- Ny hook `src/hooks/useEmbedGuard.ts` + spärr i `src/pages/Index.tsx`: appen visar bara spelen om sidan faktiskt är inbäddad som iframe med referrer från `stajlplejs.com` (bypassas i dev-läge).
- Ny databasmigration `supabase/migrations/20260321010000_...sql`: tar bort den öppna anon-insert-policyn på `snake_highscores`, lägger till `snake_sessions`/`snake_events`-tabeller för anti-fusk-spårning, och begränsar highscore-inserts till `service_role` (edge-funktionen) enligt samma mönster som redan fanns för Memory-spelet.
- `src/components/games/SnakeGame.tsx`: tar bort den direkta klient→databas-inserten. Poäng sparas nu via edge-funktionen `snake-game` (session-token, tidsvalidering mellan äpplen, rimlighetskontroll på total speltid) — samma mönster som `MemoryGame.tsx` redan använde.
- Upptäckte under arbetet att en `snake-game`-edge-funktion redan låg deployad i Supabase-projektet sedan tidigare, men var död kod: tabellerna den behövde fanns inte, och frontend anropade den aldrig. Anpassade frontend till den existerande funktionens kontrakt (`action: "apple"` osv.) istället för att skriva över den med en konkurrerande version.
- **Upptäckte och fixade en separat, allvarligare miss-konfiguration:** Vercel-driftsättningens miljövariabler (`VITE_SUPABASE_URL`/`VITE_SUPABASE_PROJECT_ID`) pekade på fel Supabase-projekt jämfört med det projekt (`kmbpnkkhbfelvpqzpdxy`) där migrationerna kördes och funktionen faktiskt ligger. Vercel-variablerna uppdaterades och appen omdeployades så att den skarpa sajten nu faktiskt pratar med rätt projekt.

**Kvarstår:**
- Lokal `.env` i repot pekar fortfarande på det gamla projekt-ID:t (`ifcsoarihdrrlxylaydl`) — påverkar inte produktion (Vercel har egna env-variabler) men bör uppdateras för att inte vilseleda vid lokal utveckling.
- Verifiera i skarp miljö: spela ett riktigt Snake-parti och bekräfta att rekordet sparas, samt att ett direkt API-anrop mot `snake_highscores` nekas.
