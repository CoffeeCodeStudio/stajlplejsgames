import { describe, it, expect } from "vitest";
import {
  isGuessCorrect,
  getGuessDisplayText,
  generateWordChoices,
  calculateScore,
  getNextDrawerIndex,
  isGameOver,
  createWordHint,
  getTimerColor,
  WORD_LIST,
} from "./scribble-logic";

describe("isGuessCorrect", () => {
  it("returns true for exact match", () => {
    expect(isGuessCorrect("katt", "katt")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isGuessCorrect("KATT", "katt")).toBe(true);
    expect(isGuessCorrect("Katt", "katt")).toBe(true);
  });

  it("trims whitespace", () => {
    expect(isGuessCorrect("  katt  ", "katt")).toBe(true);
    expect(isGuessCorrect("katt", "  katt  ")).toBe(true);
  });

  it("returns false for wrong guess", () => {
    expect(isGuessCorrect("hund", "katt")).toBe(false);
  });

  it("returns false when current word is null", () => {
    expect(isGuessCorrect("katt", null)).toBe(false);
  });

  it("returns false for partial matches", () => {
    expect(isGuessCorrect("kat", "katt")).toBe(false);
    expect(isGuessCorrect("katter", "katt")).toBe(false);
  });
});

describe("getGuessDisplayText — guess masking for drawer", () => {
  it("masks incorrect guesses for the drawer", () => {
    expect(getGuessDisplayText("hund", false, true)).toBe("••••••");
  });

  it("shows incorrect guesses to non-drawer", () => {
    expect(getGuessDisplayText("hund", false, false)).toBe("hund");
  });

  it("shows generic correct message to drawer", () => {
    expect(getGuessDisplayText("katt", true, true)).toBe("✅ Någon gissade rätt!");
  });

  it("shows specific correct message to guesser", () => {
    expect(getGuessDisplayText("katt", true, false)).toBe("✅ Rätt svar!");
  });

  it("never reveals the actual guess text to the drawer", () => {
    const secretGuess = "hemligt-svar-123";
    const drawerText = getGuessDisplayText(secretGuess, false, true);
    expect(drawerText).not.toContain(secretGuess);
    expect(drawerText).toBe("••••••");
  });
});

describe("generateWordChoices", () => {
  it("returns the requested number of words", () => {
    const choices = generateWordChoices(3);
    expect(choices).toHaveLength(3);
  });

  it("returns unique words", () => {
    const choices = generateWordChoices(3);
    expect(new Set(choices).size).toBe(3);
  });

  it("only contains words from the word list", () => {
    const choices = generateWordChoices(3);
    choices.forEach((w) => {
      expect(WORD_LIST).toContain(w);
    });
  });

  it("works with custom word list", () => {
    const custom = ["a", "b", "c"];
    const choices = generateWordChoices(2, custom);
    expect(choices).toHaveLength(2);
    choices.forEach((w) => expect(custom).toContain(w));
  });

  it("throws when requesting more words than available", () => {
    expect(() => generateWordChoices(100, ["a", "b"])).toThrow();
  });
});

describe("calculateScore", () => {
  it("adds points on correct guess", () => {
    expect(calculateScore(0, true)).toBe(10);
    expect(calculateScore(20, true)).toBe(30);
  });

  it("returns same score on incorrect guess", () => {
    expect(calculateScore(20, false)).toBe(20);
    expect(calculateScore(0, false)).toBe(0);
  });

  it("supports custom points per correct answer", () => {
    expect(calculateScore(0, true, 25)).toBe(25);
  });
});

describe("getNextDrawerIndex", () => {
  it("rotates to next player", () => {
    expect(getNextDrawerIndex(0, 3)).toBe(1);
    expect(getNextDrawerIndex(1, 3)).toBe(2);
  });

  it("wraps around to first player", () => {
    expect(getNextDrawerIndex(2, 3)).toBe(0);
  });

  it("handles single player", () => {
    expect(getNextDrawerIndex(0, 1)).toBe(0);
  });

  it("returns 0 for empty player list", () => {
    expect(getNextDrawerIndex(0, 0)).toBe(0);
  });
});

describe("isGameOver", () => {
  it("returns true when next round exceeds max", () => {
    expect(isGameOver(3, 2)).toBe(true);
    expect(isGameOver(5, 4)).toBe(true);
  });

  it("returns false when rounds remain", () => {
    expect(isGameOver(1, 2)).toBe(false);
    expect(isGameOver(2, 2)).toBe(false);
  });
});

describe("createWordHint", () => {
  it("replaces each character with underscore + space", () => {
    expect(createWordHint("katt")).toBe("_ _ _ _ ");
  });

  it("handles single character", () => {
    expect(createWordHint("a")).toBe("_ ");
  });
});

describe("getTimerColor", () => {
  it("returns red for 10 or fewer seconds", () => {
    expect(getTimerColor(10)).toBe("text-red-400");
    expect(getTimerColor(1)).toBe("text-red-400");
    expect(getTimerColor(0)).toBe("text-red-400");
  });

  it("returns orange for 11-20 seconds", () => {
    expect(getTimerColor(20)).toBe("text-orange-400");
    expect(getTimerColor(15)).toBe("text-orange-400");
    expect(getTimerColor(11)).toBe("text-orange-400");
  });

  it("returns white for more than 20 seconds", () => {
    expect(getTimerColor(21)).toBe("text-white/80");
    expect(getTimerColor(60)).toBe("text-white/80");
  });
});
