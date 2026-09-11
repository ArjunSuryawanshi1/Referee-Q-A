import { describe, expect, it } from "vitest";
import { validateGeneratedQuestions } from "../src/shared/validation";

function makeQuestion(index: number, overrides = {}) {
  return {
    id: `q-${index}`,
    teamA: `Team Color ${index}`,
    teamB: `Team Other ${index}`,
    scenario: `A Team Other ${index} player trips a Team Color ${index} player near the touchline while trying to reach the ball.`,
    choices: [
      { id: "A", text: `Direct free kick to Team Color ${index} and no disciplinary action because the challenge is only careless.` },
      { id: "B", text: `Indirect free kick to Team Color ${index} and caution the opponent.` },
      { id: "C", text: `Direct free kick to Team Other ${index} and caution the attacker.` },
      { id: "D", text: `Dropped ball to Team Color ${index} from the location of the ball.` }
    ],
    correctChoiceId: "A",
    explanation: "The physical contact is a direct-free-kick foul and no card is required for a careless challenge.",
    conceptTags: ["Fouls", "Free Kick Decisions"],
    difficulty: "beginner",
    lawReferences: ["Law 12 - Fouls and Misconduct"],
    mechanicsFocus: "Whistle and indicate the direction of the direct free kick.",
    ...overrides
  };
}

function makeRound(overrides: Record<number, object> = {}) {
  return {
    questions: Array.from({ length: 10 }, (_, index) =>
      makeQuestion(index + 1, overrides[index + 1] ?? {})
    )
  };
}

describe("validateGeneratedQuestions", () => {
  it("accepts a valid 10-question round", () => {
    const result = validateGeneratedQuestions(makeRound());
    expect(result.ok).toBe(true);
    expect(result.questions).toHaveLength(10);
    expect(result.questions[0].questionHash).toBeTruthy();
  });

  it("rejects the wrong number of questions", () => {
    const result = validateGeneratedQuestions({ questions: [makeQuestion(1)] });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("exactly 10");
  });

  it("rejects repeated color pairings", () => {
    const result = validateGeneratedQuestions(
      makeRound({
        2: { teamA: "Team Color 1", teamB: "Team Other 1" }
      })
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("repeats team color pairing");
  });

  it("rejects giveaway classifications in scenarios", () => {
    const result = validateGeneratedQuestions(
      makeRound({
        1: { scenario: "A Team Other 1 player commits a reckless tackle near midfield." }
      })
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("reckless");
  });

  it("rejects vague answer choices", () => {
    const result = validateGeneratedQuestions(
      makeRound({
        1: {
          choices: [
            { id: "A", text: "Give a free kick." },
            { id: "B", text: "Direct free kick to Team Color 1 and no disciplinary action." },
            { id: "C", text: "Dropped ball to the goalkeeper in the penalty area." },
            { id: "D", text: "Throw-in to Team Other 1 from the touchline." }
          ]
        }
      })
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("too vague");
  });
});
