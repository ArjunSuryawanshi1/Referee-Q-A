import type { GenerationRequest, GenerationResponse } from "../shared/types";
import { fallbackRound } from "../../server/fallback";

export async function generateRound(request: GenerationRequest): Promise<GenerationResponse> {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      return fallbackRound(request.forbiddenQuestionHashes);
    }

    return (await response.json()) as GenerationResponse;
  } catch {
    return fallbackRound(request.forbiddenQuestionHashes);
  }
}
