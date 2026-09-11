import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import type { GenerationResponse, Question } from "../src/shared/types";

const questions: Question[] = Array.from({ length: 10 }, (_, index) => ({
  id: `ui-${index + 1}`,
  teamA: `Team Blue ${index + 1}`,
  teamB: `Team Red ${index + 1}`,
  scenario: `A Team Red ${index + 1} defender trips a Team Blue ${index + 1} attacker near midfield.`,
  choices: [
    { id: "A", text: `Direct free kick to Team Blue ${index + 1} and no disciplinary action.` },
    { id: "B", text: `Indirect free kick to Team Blue ${index + 1}.` },
    { id: "C", text: `Dropped ball to Team Red ${index + 1}.` },
    { id: "D", text: `Throw-in to Team Blue ${index + 1}.` }
  ],
  correctChoiceId: "A",
  explanation: "The trip is a direct-free-kick offense.",
  conceptTags: ["Fouls", "Free Kick Decisions"],
  difficulty: "beginner",
  lawReferences: ["Law 12 - Fouls and Misconduct"],
  mechanicsFocus: "Whistle and indicate the direction of the direct free kick.",
  questionHash: `hash-${index + 1}`
}));

function response(): GenerationResponse {
  return {
    questions,
    metadata: { source: "fallback", attempts: 0, generatedAt: new Date().toISOString() }
  };
}

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => response()
      })
    );
  });

  it("loads a round, answers a question, and shows feedback", async () => {
    render(<App />);
    expect(await screen.findByText(/A Team Red 1 defender trips/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^A\. Direct free kick to Team Blue 1/i }));

    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(/The trip is a direct-free-kick offense/i)).toBeInTheDocument();
  });

  it("persists progress after answering", async () => {
    render(<App />);
    expect(await screen.findByText(/A Team Red 1 defender trips/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /indirect free kick to team blue 1/i }));
    await waitFor(() => {
      expect(window.localStorage.getItem("referee-quiz-progress-v1")).toContain("hash-1");
    });
  });
});
