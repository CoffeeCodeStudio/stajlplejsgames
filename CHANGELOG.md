# Changelog

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
