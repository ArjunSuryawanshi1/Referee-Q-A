import { describe, expect, it } from "vitest";
import { completeRound, createInitialProgress, getWeakAreas, nextDifficulty, recordAnswer } from "../src/lib/progress";
import type { Question } from "../src/shared/types";

const question: Question = {
  id: "q1",
  teamA: "Team Blue",
  teamB: "Team Red",
  scenario: "A defender trips an attacker.",
  choices: [
    { id: "A", text: "Direct free kick to Team Blue and no disciplinary action." },
    { id: "B", text: "Indirect free kick to Team Blue." },
    { id: "C", text: "Dropped ball." },
    { id: "D", text: "Throw-in to Team Red." }
  ],
  correctChoiceId: "A",
  explanation: "The trip is a direct-free-kick offense.",
  conceptTags: ["Fouls", "Free Kick Decisions"],
  difficulty: "beginner",
  lawReferences: ["Law 12 - Fouls and Misconduct"],
  mechanicsFocus: "Whistle and indicate direction.",
  questionHash: "abc123"
};

describe("progress", () => {
  it("records concept stats and weak areas after a miss", () => {
    const initial = createInitialProgress();
    const result = recordAnswer(initial, question, "B");
    expect(result.answer.correct).toBe(false);
    expect(result.progress.conceptStats.Fouls.attempted).toBe(1);
    expect(result.progress.conceptStats.Fouls.correct).toBe(0);
    expect(getWeakAreas(result.progress)[0]).toBe("Fouls");
  });

  it("adjusts difficulty from round percentage", () => {
    expect(nextDifficulty("beginner", 90)).toBe("intermediate");
    expect(nextDifficulty("intermediate", 90)).toBe("advanced");
    expect(nextDifficulty("advanced", 40)).toBe("intermediate");
    expect(nextDifficulty("beginner", 40)).toBe("beginner");
  });

  it("stores a round summary and advances the round number", () => {
    const initial = createInitialProgress();
    const first = recordAnswer(initial, question, "A");
    const completed = completeRound(first.progress, [first.answer]);
    expect(completed.roundNumber).toBe(2);
    expect(completed.roundHistory[0].score).toBe(1);
    expect(completed.roundHistory[0].percentage).toBe(100);
  });
});
