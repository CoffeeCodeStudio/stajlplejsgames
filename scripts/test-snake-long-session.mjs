// End-to-end test of the snake-game edge function: plays a full 70-apple
// session at human-plausible pace and checks the server saves the score.
//
// This reproduces the class of bug where a long, legitimate run scored 0 —
// either because apple events never landed (missing snake_events.event_type
// column) or because the client never sent "finish". Running it against a
// real project exercises the same path the browser does.
//
// WARNING: this writes a real row to snake_highscores under the name
// "TestBot" and it will likely land at the top of the public leaderboard.
// See the cleanup note at the bottom of this file.
//
// Usage:
//   node scripts/test-snake-long-session.mjs --yes
//   node scripts/test-snake-long-session.mjs --yes --apples 12
//
// Requires Node 18+ (global fetch).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── args ──
const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const getArg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const APPLES = Number(getArg("apples", 70));
const MIN_DELAY_MS = Number(getArg("min-delay", 600));
const MAX_DELAY_MS = Number(getArg("max-delay", 1500));
const USERNAME = getArg("username", "TestBot");

if (!hasFlag("yes")) {
  console.error(
    "This writes a real highscore to the live leaderboard as " +
      `"${USERNAME}". Re-run with --yes to confirm.`
  );
  process.exit(1);
}
if (!Number.isInteger(APPLES) || APPLES < 1) {
  console.error(`--apples must be a positive integer, got: ${getArg("apples")}`);
  process.exit(1);
}

// ── .env ──
function loadEnv() {
  let raw;
  try {
    raw = readFileSync(join(ROOT, ".env"), "utf8");
  } catch {
    console.error("Could not read .env at project root.");
    process.exit(1);
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const projectId = env.VITE_SUPABASE_PROJECT_ID;
const anonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

for (const [name, val] of [
  ["VITE_SUPABASE_PROJECT_ID", projectId],
  ["VITE_SUPABASE_PUBLISHABLE_KEY", anonKey],
]) {
  if (!val) {
    console.error(`Missing ${name} in .env`);
    process.exit(1);
  }
}

const ENDPOINT = `https://${projectId}.supabase.co/functions/v1/snake-game`;

// Mirrors calcScore() in supabase/functions/snake-game/index.ts and the
// per-apple formula in SnakeGame.tsx, so we can assert the server agrees.
function expectedScore(appleCount) {
  let score = 0;
  for (let i = 0; i < appleCount; i++) score += 10 + Math.floor((i + 1) / 5) * 5;
  return score;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () =>
  Math.floor(MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));

async function call(body) {
  const started = Date.now();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anonKey },
    body: JSON.stringify(body),
  });
  const elapsed = Date.now() - started;
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // leave json null; raw text is reported below
  }
  return { status: res.status, ok: res.ok, json, raw: text, elapsed };
}

// ── run ──
console.log(`endpoint : ${ENDPOINT}`);
console.log(`username : ${USERNAME}`);
console.log(`apples   : ${APPLES} @ ${MIN_DELAY_MS}-${MAX_DELAY_MS}ms`);
console.log(`expected : ${expectedScore(APPLES)}p`);
console.log("");

const start = await call({ action: "start", username: USERNAME });
console.log(`start  -> ${start.status} (${start.elapsed}ms) ${start.raw}`);
if (!start.ok || !start.json?.session_token) {
  console.error("\nFAIL: no session_token returned; aborting.");
  process.exit(1);
}
const sessionToken = start.json.session_token;

let sent = 0;
let failed = 0;
const runStarted = Date.now();

for (let i = 1; i <= APPLES; i++) {
  await sleep(randomDelay());
  const r = await call({ action: "apple", session_token: sessionToken });
  if (r.ok && !r.json?.error) {
    sent++;
  } else {
    failed++;
    console.log(`apple ${String(i).padStart(3)} -> ${r.status} FAIL ${r.raw}`);
    continue;
  }
  // Keep the log readable on long runs: every apple for short sessions,
  // every 10th once we're past the point where each one is interesting.
  if (APPLES <= 15 || i % 10 === 0 || i === APPLES) {
    console.log(`apple ${String(i).padStart(3)} -> ${r.status} (${r.elapsed}ms) ok`);
  }
}

const playedMs = Date.now() - runStarted;
console.log(
  `\napples sent: ${sent}/${APPLES} (${failed} failed) over ${(playedMs / 1000).toFixed(1)}s` +
    `, avg ${(playedMs / APPLES).toFixed(0)}ms/apple\n`
);

const finish = await call({ action: "finish", session_token: sessionToken });
console.log(`finish -> ${finish.status} (${finish.elapsed}ms) ${finish.raw}\n`);

// ── verdict ──
const want = expectedScore(sent);
const got = finish.json?.score;

if (!finish.ok) {
  console.error(`FAIL: finish returned HTTP ${finish.status}`);
  process.exit(1);
}
if (finish.json?.valid !== true) {
  console.error(
    `FAIL: server rejected the session as invalid (score ${got}).\n` +
      "  Anti-cheat tripped — check the edge function logs for the reason."
  );
  process.exit(1);
}
if (got !== want) {
  console.error(`FAIL: score mismatch — expected ${want}p for ${sent} apples, got ${got}p`);
  process.exit(1);
}

console.log(`PASS: ${sent} apples -> ${got}p, saved as "${USERNAME}".`);
console.log(
  "Cleanup (leaderboard row persists):\n" +
    `  delete from snake_highscores where username = '${USERNAME}';`
);
