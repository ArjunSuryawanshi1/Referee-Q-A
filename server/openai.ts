import { QUESTION_SET_SCHEMA, buildGenerationPrompt } from "./prompt";
import type { GenerationRequest } from "../src/shared/types";

interface OpenAIResult {
  body: unknown;
  model: string;
}

export async function generateWithOpenAI(
  request: GenerationRequest,
  validationErrors: string[] = []
): Promise<OpenAIResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You generate accurate, practical IFAB soccer referee training questions. You obey schema and do not include explanatory prose outside JSON."
        },
        {
          role: "user",
          content: buildGenerationPrompt(request, validationErrors)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "referee_quiz_round",
          strict: true,
          schema: QUESTION_SET_SCHEMA
        }
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const data = (await response.json()) as { output_text?: string };
  if (!data.output_text) {
    throw new Error("OpenAI response did not include output_text.");
  }

  return { body: JSON.parse(data.output_text), model };
}
