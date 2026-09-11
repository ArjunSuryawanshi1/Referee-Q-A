import { CONCEPT_AREAS, type GenerationRequest } from "../src/shared/types";

export const QUESTION_SET_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "teamA",
          "teamB",
          "scenario",
          "choices",
          "correctChoiceId",
          "explanation",
          "conceptTags",
          "difficulty",
          "lawReferences",
          "mechanicsFocus"
        ],
        properties: {
          id: { type: "string" },
          teamA: { type: "string" },
          teamB: { type: "string" },
          scenario: { type: "string" },
          choices: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "text"],
              properties: {
                id: { type: "string" },
                text: { type: "string" }
              }
            }
          },
          correctChoiceId: { type: "string" },
          explanation: { type: "string" },
          conceptTags: {
            type: "array",
            minItems: 1,
            items: { type: "string", enum: CONCEPT_AREAS }
          },
          difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          lawReferences: {
            type: "array",
            minItems: 1,
            items: { type: "string" }
          },
          mechanicsFocus: { type: "string" }
        }
      }
    }
  }
} as const;

export function buildGenerationPrompt(request: GenerationRequest, validationErrors: string[] = []): string {
  return `
You are building a center-referee soccer training quiz using IFAB Laws of the Game 2026/27.

Generate exactly 10 brand-new multiple-choice match scenarios for round ${request.roundNumber}.
Target difficulty: ${request.difficulty}.
Prioritize weak concepts when useful: ${request.weakConcepts.join(", ") || "none yet"}.
Recently used concepts to vary: ${request.recentlyUsedConcepts.join(", ") || "none"}.

Hard requirements:
- Each question must feel like: "You are the center referee. This just happened. What do you do?"
- Use two teams in every scenario, and use team colors only. Change color pair every question.
- Do not repeat any color pairing inside this round.
- Do not include these classification answers inside the scenario text when the user must identify them: careless, reckless, excessive force, serious foul play, violent conduct, dissent, simulation, DOGSO, SPA, stopping a promising attack, denying an obvious goal-scoring opportunity, persistent offenses, delaying the restart, failure to respect required distance, impeding, handball offense, offside offense.
- Describe physical facts instead. Example: "slides with little regard for the danger" is allowed; "reckless tackle" is not.
- Each question must have exactly 4 choices.
- Only one choice is the best complete answer.
- Every choice must be a complete referee decision, not a vague phrase.
- Correct answers should identify the restart, the team receiving it, misconduct if any, card if any, signal or referee procedure when relevant.
- Feedback must be practical, concise, and use proper IFAB referee terminology.
- Regularly test serious foul play versus violent conduct accurately: serious foul play is during a challenge for the ball; violent conduct is not a challenge for the ball or involves others as covered by Law 12.
- Direct free kick signal answers must not say the referee raises an arm above the head. Indirect free kick answers should say direction first, then one arm straight above the head and kept raised as required.
- Offside questions must distinguish offside position from offside offense.
- Handball questions must not teach that every ball-to-hand contact is an offense.
- Use these concept tags exactly when applicable: ${CONCEPT_AREAS.join(", ")}.
- Avoid these already used question hashes: ${request.forbiddenQuestionHashes.slice(-80).join(", ") || "none"}.

Difficulty guidance:
- Beginner: DFK vs IFK, throw-ins, corners, goal kicks, simple fouls, careless vs reckless, basic cards.
- Intermediate: advantage, simulation, persistent offenses, offside involvement, goalkeeper offenses, quick vs ceremonial free kicks, AR communication.
- Advanced: DOGSO vs SPA, advantage plus misconduct, penalty-area disciplinary exceptions, deliberate play vs deliberate save, simultaneous offenses, stoppage misconduct, substitutes/team officials, complex restart procedures.

${validationErrors.length ? `The prior output failed validation. Fix these issues:\n${validationErrors.join("\n")}` : ""}
Return only JSON matching the required schema.
`.trim();
}
