# Architecture — StajlPlejs Game Zone

## Översikt

Appen är en fristående spelmodul tänkt att bäddas in som iframe på stajlplejs.se. Den har ingen egen autentisering — användarnamnet skickas in via URL-parameter från värdssidan.

```
stajlplejs.se
  └── <iframe src="https://stajlplejsgames.vercel.app?usr=Användarnamn">
        └── StajlPlejs Game Zone (denna app)
              └── Supabase (databas + edge functions)
```

> **OBS (2026-07-20):** `useEmbedGuard` returnerar numera alltid `true` — appen laddas och visas oavsett om den faktiskt är inbäddad i en iframe, oavsett referrer/domän. Det finns alltså i nuläget ingen spärr mot att öppna appen direkt via Vercel-URL:en. Detta gjordes avsiktligt (se CHANGELOG 2026-07-20); säkerhet på den fronten är tänkt att hanteras på annat sätt senare. Skrivskydd mot highscore-tabellerna (RLS + Edge Functions) påverkas inte av detta och gäller fortfarande.

---

## Tech Stack

| Lager | Teknik |
|-------|--------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Databas | Supabase (Postgres + Realtime) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Hosting | Vercel |

---

## Identitet & autentisering

Inga riktiga användarkonton. Två identitetsmekanismer:

- **`?usr=Namn`** — användarnamn från URL-parameter (sätts av stajlplejs.se vid inbäddning). Läses av `usePlayer` hook. Används för leaderboards.
- **`scribble_guest_id`** — random UUID genererat i localStorage. Används som anonym identitet i Scribble multiplayer. Sätts av `useGuestId` hook.

---

## Mappstruktur

```
src/
  pages/
    Index.tsx              # Rotsida, läser ?usr= och renderar GamesSection
  components/
    games/
      GamesSection.tsx     # Spelväljare, hanterar routing mellan spel
      SnakeGame.tsx        # Snake — single-player
      MemoryGame.tsx       # Memory — single-player
      ScribbleGame.tsx     # Scribble — multiplayer spelvy
      ScribbleLobbyList.tsx # Scribble — lobbylistning
    ui/                    # shadcn/ui-komponenter
  hooks/
    usePlayer.ts           # Läser ?usr= från URL
    useGuestId.ts          # Skapar/hämtar anonym gäst-ID från localStorage
    useScribble.ts         # Supabase-logik för Scribble (lobbys, spelare, gissningar)
    useEmbedGuard.ts       # Returnerar alltid { isEmbedded: true } — ingen faktisk spärr just nu
  lib/
    scribble-logic.ts      # Ren spellogik för Scribble (testbar, utan sidoeffekter)
    game-effects.ts        # Ljud och konfetti-effekter
  integrations/
    supabase/
      client.ts            # Supabase-klient
      types.ts             # Auto-genererade DB-typer

supabase/
  functions/
    memory-game/index.ts   # Edge Function: server-side validering för Memory
    snake-game/index.ts    # Edge Function: server-side validering för Snake
  migrations/
    001_initial_schema.sql # Hela databasschemat i en fil
```

---

## Spel

`GamesSection.tsx` renderar en tvåkolumnslayout på startvyn:
- **Vänster (smal):** kompakta spelkort för Memory/Snake/Scribble med Spela-knapp och, om användaren är inloggad, personligt rekord hämtat från respektive highscore-tabell (`... where username = username`). Under korten visas en peek på en öppen Scribble-lobby om en finns.
- **Höger (bred):** aktivitetsfeed som slår ihop de senaste raderna från `snake_highscores` och `memory_highscores`, sorterat på tid. Varje rad jämförs mot det globala rekordet för det spelet och får max en badge: 🥇 Nytt rekord (poäng > rekord), 🤝 Lika rekord (poäng = rekord), ⚡ Nära rekord (poäng ≥ 85 % av rekordet).

### Snake
- All spellogik körs på canvas i browsern
- Canvasen är responsiv (CSS `width: 100%` + `aspect-ratio: 1/1`, `max-width` satt till den ursprungliga pixelstorleken) — skalar ner på smala mobilskärmar, skalar aldrig upp förbi native-storleken
- Styrs med tangentbord (piltangenter/WASD) och/eller ett touch-D-pad (▲◄▼►, visas bara under `md`-brytpunkten) — båda anropar samma riktningslogik
- Vid äpple: skickar `apple`-event till Edge Function (`snake-game`)
- Vid game over: skickar `finish` till Edge Function som validerar och sparar highscore
- Lokalt bästa sparas i `localStorage` som fallback

### Memory
- All spellogik körs i browsern
- Skapar en server-session via Edge Function (`memory-game`) vid spelstart
- Varje kortpar-match loggas som event till servern
- Vid vinst: `finish`-anrop validerar och sparar highscore server-side

### Scribble (multiplayer)
- Spelstatus lever i Supabase (`scribble_lobbies`, `scribble_players`, `scribble_guesses`)
- Realtidsuppdateringar via Supabase Realtime (Postgres changes)
- Spelarna identifieras med `scribble_guest_id` (localStorage UUID)
- Ritning sker på HTML canvas — streck-data synkroniseras via Supabase Realtime broadcast
- Runda-logik, timeout och städning av inaktiva spelare hanteras av klienterna (ingen dedikerad spelserver)

---

## Databas

### Tabeller

| Tabell | Syfte |
|--------|-------|
| `snake_highscores` | Topplista Snake |
| `snake_sessions` | Server-side spelsessioner för Snake anti-cheat |
| `snake_events` | Logg av äppelhändelser per Snake-session |
| `memory_highscores` | Topplista Memory |
| `memory_sessions` | Server-side spelsessioner för Memory anti-cheat |
| `memory_events` | Logg av kortmatch-händelser per Memory-session |
| `scribble_lobbies` | Aktiva Scribble-lobbys |
| `scribble_players` | Spelare i en lobby (med poäng) |
| `scribble_guesses` | Gissningar och systemmeddelanden i chat |

### RLS (Row Level Security)

Alla tabeller har RLS aktiverat. `anon`-rollen (oinloggade besökare) har läs- och skrivbehörighet på alla speltabeller. Highscores skrivs enbart via Edge Functions med service role key — inte direkt från klienten.

---

## Edge Functions (Anti-cheat)

Både Snake och Memory använder server-side validering:

1. **Start** — skapar en session i DB, returnerar `session_token`
2. **Events** — klienten loggar händelser (äpplen/kortpar) med tidsstämplar
3. **Finish** — servern validerar:
   - Minsta tid mellan events (för snabb = flaggas). Snake: eftersom varje
     äpple-plockning är en egen fire-and-forget request mäter servern
     *ankomsttid*, inte klient-tick-tid, så nätverksjitter kan göra enstaka
     legitima events se ut som de kom nästan samtidigt. Snake använder därför
     en tvådelad koll — 15ms hård gräns för en enskild lucka (fångar bara
     i praktiken samtidiga events) + 200ms snittgräns över hela omgången
     (tål enstaka jitter, stoppar ändå botar). Memory har fortfarande bara
     en hård per-par-gräns (350ms) — inte testat om samma jitterproblem
     finns där.
   - Minsta total speltid
   - Rätt antal events (Memory kräver exakt rätt antal par)
   - Sanity-cap på äppelantal (Snake)
   - Score beräknas server-side och sparas med service role key

Scribble har ingen server-side validering — poängsättning sker direkt i klienten.

---

## Miljövariabler

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_PROJECT_ID=<project-id>
```

Sätts i Vercel dashboard under Settings → Environment Variables.
