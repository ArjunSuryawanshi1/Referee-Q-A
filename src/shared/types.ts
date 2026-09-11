export const CONCEPT_AREAS = [
  "Free Kick Decisions",
  "Signals",
  "Fouls",
  "Misconduct",
  "Advantage",
  "Offside",
  "DOGSO / SPA",
  "Restarts",
  "Goalkeeper Rules",
  "Assistant Referee Communication",
  "Positioning",
  "Match Management"
] as const;

export type ConceptArea = (typeof CONCEPT_AREAS)[number];

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  teamA: string;
  teamB: string;
  scenario: string;
  choices: Choice[];
  correctChoiceId: string;
  explanation: string;
  conceptTags: ConceptArea[];
  difficulty: Difficulty;
  lawReferences: string[];
  mechanicsFocus: string;
  questionHash: string;
}

export interface GenerationRequest {
  difficulty: Difficulty;
  weakConcepts: ConceptArea[];
  recentlyUsedConcepts: ConceptArea[];
  forbiddenQuestionHashes: string[];
  roundNumber: number;
}

export interface GenerationMetadata {
  source: "openai" | "fallback";
  model?: string;
  attempts: number;
  generatedAt: string;
}

export interface GenerationResponse {
  questions: Question[];
  metadata: GenerationMetadata;
}

export interface ConceptStats {
  correct: number;
  attempted: number;
}

export interface AnswerRecord {
  questionId: string;
  questionHash: string;
  selectedChoiceId: string;
  correct: boolean;
  conceptTags: ConceptArea[];
  answeredAt: string;
}

export interface RoundSummary {
  roundNumber: number;
  score: number;
  total: number;
  percentage: number;
  weakAreas: ConceptArea[];
  completedAt: string;
}

export interface UserProgress {
  answeredHashes: string[];
  conceptStats: Record<ConceptArea, ConceptStats>;
  recentMisses: ConceptArea[];
  currentDifficulty: Difficulty;
  roundNumber: number;
  roundHistory: RoundSummary[];
}

export interface ActiveRound {
  questions: Question[];
  currentIndex: number;
  answers: AnswerRecord[];
  metadata: GenerationMetadata;
}
