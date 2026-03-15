/**
 * Pure logic functions for the Scribble game, extracted for testability.
 */

export const WORD_LIST = [
  "hund", "katt", "sol", "hus", "bil", "träd", "blomma", "fisk",
  "bok", "stol", "bord", "telefon", "glass", "pizza", "gitarr",
  "kanin", "elefant", "cykel", "banan", "jordgubbe", "paraply",
  "robot", "raket", "fjäril", "snögubbe", "drake", "krona",
  "hjärta", "stjärna", "måne", "berg", "sjö", "båt", "flygplan",
  "dator", "mus", "nycklar", "lampa", "klocka", "regnbåge",
  "fotboll", "skateboard", "glass", "tårta", "clown", "dinosaurie",
];

/** Check if a guess matches the current word (case-insensitive, trimmed) */
export function isGuessCorrect(guess: string, currentWord: string | null): boolean {
  if (!currentWord) return false;
  return guess.trim().toLowerCase() === currentWord.trim().toLowerCase();
}

/** Get the display text for a guess, masking content for the drawer */
export function getGuessDisplayText(
  guess: string,
  isCorrect: boolean,
  isDrawer: boolean
): string {
  if (isCorrect) {
    return isDrawer ? "✅ Någon gissade rätt!" : "✅ Rätt svar!";
  }
  return isDrawer ? "••••••" : guess;
}

/** Generate N unique random word choices from the word list */
export function generateWordChoices(count: number, wordList: string[] = WORD_LIST): string[] {
  if (count > wordList.length) {
    throw new Error(`Cannot pick ${count} unique words from a list of ${wordList.length}`);
  }
  const choices: string[] = [];
  const used = new Set<string>();
  while (choices.length < count) {
    const w = wordList[Math.floor(Math.random() * wordList.length)];
    if (!used.has(w)) {
      choices.push(w);
      used.add(w);
    }
  }
  return choices;
}

/** Calculate new score after a correct guess */
export function calculateScore(currentScore: number, isCorrect: boolean, pointsPerCorrect = 10): number {
  return isCorrect ? currentScore + pointsPerCorrect : currentScore;
}

/** Determine the next drawer index using round-robin rotation */
export function getNextDrawerIndex(currentDrawerIndex: number, playerCount: number): number {
  if (playerCount === 0) return 0;
  return (currentDrawerIndex + 1) % playerCount;
}

/** Check if the game should end based on rounds played */
export function isGameOver(nextRound: number, maxRounds: number): boolean {
  return nextRound > maxRounds;
}

/** Create a word hint with underscores (e.g. "katt" -> "_ _ _ _") */
export function createWordHint(word: string): string {
  return word.replace(/./g, "_ ");
}

/** Get the timer color class based on remaining seconds */
export function getTimerColor(timeLeft: number): string {
  if (timeLeft <= 10) return "text-red-400";
  if (timeLeft <= 20) return "text-orange-400";
  return "text-white/80";
}
