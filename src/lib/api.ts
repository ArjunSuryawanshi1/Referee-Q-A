import type { GenerationRequest, GenerationResponse } from "../shared/types";

export async function generateRound(request: GenerationRequest): Promise<GenerationResponse> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const message =
      typeof detail.error === "string"
        ? detail.error
        : "The training round could not be generated.";
    throw new Error(message);
  }

  return (await response.json()) as GenerationResponse;
}
