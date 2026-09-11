import {
  CONCEPT_AREAS,
  type ActiveRound,
  type AnswerRecord,
  type ConceptArea,
  type Difficulty,
  type Question,
  type RoundSummary,
  type UserProgress
} from "../shared/types";

export const PROGRESS_KEY = "referee-quiz-progress-v1";
export const ROUND_KEY = "referee-quiz-active-round-v1";

export function createInitialProgress(): UserProgress {
  return {
    answeredHashes: [],
    conceptStats: Object.fromEntries(
      CONCEPT_AREAS.map((concept) => [concept, { correct: 0, attempted: 0 }])
    ) as UserProgress["conceptStats"],
    recentMisses: [],
    currentDifficulty: "beginner",
    roundNumber: 1,
    roundHistory: []
  };
}

export function recordAnswer(
  progress: UserProgress,
  question: Question,
  selectedChoiceId: string
): { progress: UserProgress; answer: AnswerRecord } {
  const correct = selectedChoiceId === question.correctChoiceId;
  const answer: AnswerRecord = {
    questionId: question.id,
    questionHash: question.questionHash,
    selectedChoiceId,
    correct,
    conceptTags: question.conceptTags,
    answeredAt: new Date().toISOString()
  };

  const conceptStats = { ...progress.conceptStats };
  question.conceptTags.forEach((concept) => {
    const current = conceptStats[concept] ?? { correct: 0, attempted: 0 };
    conceptStats[concept] = {
      attempted: current.attempted + 1,
      correct: current.correct + (correct ? 1 : 0)
    };
  });

  const recentMisses = correct
    ? progress.recentMisses
    : [...question.conceptTags, ...progress.recentMisses].slice(0, 8);

  return {
    answer,
    progress: {
      ...progress,
      answeredHashes: [...new Set([...progress.answeredHashes, question.questionHash])].slice(-250),
      conceptStats,
      recentMisses
    }
  };
}

export function completeRound(progress: UserProgress, answers: AnswerRecord[]): UserProgress {
  const total = answers.length;
  const score = answers.filter((answer) => answer.correct).length;
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const summary: RoundSummary = {
    roundNumber: progress.roundNumber,
    score,
    total,
    percentage,
    weakAreas: getWeakAreas(progress).slice(0, 3),
    completedAt: new Date().toISOString()
  };

  return {
    ...progress,
    currentDifficulty: nextDifficulty(progress.currentDifficulty, percentage),
    roundNumber: progress.roundNumber + 1,
    roundHistory: [summary, ...progress.roundHistory].slice(0, 12)
  };
}

export function nextDifficulty(current: Difficulty, percentage: number): Difficulty {
  if (percentage >= 85) {
    if (current === "beginner") return "intermediate";
    if (current === "intermediate") return "advanced";
  }
  if (percentage <= 45) {
    if (current === "advanced") return "intermediate";
    if (current === "intermediate") return "beginner";
  }
  return current;
}

export function getWeakAreas(progress: UserProgress): ConceptArea[] {
  const scored = CONCEPT_AREAS.map((concept) => {
    const stats = progress.conceptStats[concept];
    const accuracy = stats.attempted ? stats.correct / stats.attempted : 1;
    const recentMissIndex = progress.recentMisses.indexOf(concept);
    const recentPenalty = progress.recentMisses.filter((miss) => miss === concept).length * 0.15;
    return { concept, score: accuracy - recentPenalty, attempted: stats.attempted, recentMissIndex };
  });

  return scored
    .filter((entry) => entry.attempted > 0 || progress.recentMisses.includes(entry.concept))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.recentMissIndex === -1) return 1;
      if (b.recentMissIndex === -1) return -1;
      return a.recentMissIndex - b.recentMissIndex;
    })
    .map((entry) => entry.concept);
}

export function getRecentlyUsedConcepts(round: ActiveRound | null): ConceptArea[] {
  if (!round) return [];
  return [...new Set(round.questions.flatMap((question) => question.conceptTags))].slice(0, 6);
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function clearSavedState(): void {
  window.localStorage.removeItem(PROGRESS_KEY);
  window.localStorage.removeItem(ROUND_KEY);
}
