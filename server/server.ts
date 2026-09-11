import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GenerationRequest, GenerationResponse } from "../src/shared/types";
import { validateGeneratedQuestions } from "../src/shared/validation";
import { generateWithOpenAI } from "./openai";
import { fallbackRound } from "./fallback";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const app = express();
const port = Number(process.env.PORT || 8787);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/generate", async (request, response) => {
  const body = sanitizeGenerationRequest(request.body);
  const forbiddenHashes = body.forbiddenQuestionHashes;

  if (!process.env.OPENAI_API_KEY) {
    response.json(fallbackRound(forbiddenHashes));
    return;
  }

  let priorErrors: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const result = await generateWithOpenAI(body, priorErrors);
      const validation = validateGeneratedQuestions(result.body, forbiddenHashes);
      if (validation.ok) {
        const payload: GenerationResponse = {
          questions: validation.questions,
          metadata: {
            source: "openai",
            model: result.model,
            attempts: attempt,
            generatedAt: new Date().toISOString()
          }
        };
        response.json(payload);
        return;
      }
      priorErrors = validation.errors;
    } catch (error) {
      priorErrors = [error instanceof Error ? error.message : "Unknown generation error."];
    }
  }

  response.status(502).json({
    error: "The AI generator could not produce a valid referee quiz round.",
    details: priorErrors
  });
});

const distPath = path.join(root, "dist");
app.use(express.static(distPath));
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Referee quiz API listening on http://localhost:${port}`);
});

function sanitizeGenerationRequest(input: Partial<GenerationRequest>): GenerationRequest {
  return {
    difficulty:
      input.difficulty === "intermediate" || input.difficulty === "advanced"
        ? input.difficulty
        : "beginner",
    weakConcepts: Array.isArray(input.weakConcepts) ? input.weakConcepts : [],
    recentlyUsedConcepts: Array.isArray(input.recentlyUsedConcepts) ? input.recentlyUsedConcepts : [],
    forbiddenQuestionHashes: Array.isArray(input.forbiddenQuestionHashes)
      ? input.forbiddenQuestionHashes.filter((hash): hash is string => typeof hash === "string")
      : [],
    roundNumber: typeof input.roundNumber === "number" ? input.roundNumber : 1
  };
}
