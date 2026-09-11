import { CONCEPT_AREAS, type ConceptArea, type Difficulty, type Question } from "./types";
import { questionFingerprint } from "./hash";

const DIFFICULTIES = new Set<Difficulty>(["beginner", "intermediate", "advanced"]);
const CONCEPTS = new Set<ConceptArea>(CONCEPT_AREAS);

export const BANNED_SCENARIO_TERMS = [
  "careless",
  "reckless",
  "excessive force",
  "serious foul play",
  "violent conduct",
  "unsporting behavior",
  "dissent",
  "simulation",
  "dogso",
  "spa",
  "stopping a promising attack",
  "denying an obvious goal-scoring opportunity",
  "persistent offenses",
  "delaying the restart",
  "failing to respect",
  "failure to respect",
  "impeding",
  "handball offense",
  "offside offense",
  "interfering with play",
  "interfering with an opponent",
  "gaining an advantage"
];

const VAGUE_CHOICE_PATTERNS = [
  /^give a free kick\.?$/i,
  /^award a free kick\.?$/i,
  /^give a card\.?$/i,
  /^show a card\.?$/i,
  /^raise your arm\.?$/i,
  /^play on\.?$/i,
  /^stop play\.?$/i
];

export interface ValidationResult {
  ok: boolean;
  questions: Question[];
  errors: string[];
}

export function validateGeneratedQuestions(
  value: unknown,
  forbiddenHashes: string[] = []
): ValidationResult {
  const errors: string[] = [];
  const rawQuestions = extractQuestions(value);
  const questions: Question[] = [];
  const colorPairs = new Set<string>();
  const hashes = new Set(forbiddenHashes);

  if (!Array.isArray(rawQuestions)) {
    return { ok: false, questions: [], errors: ["Response must contain a questions array."] };
  }

  if (rawQuestions.length !== 10) {
    errors.push(`Response must contain exactly 10 questions; received ${rawQuestions.length}.`);
  }

  rawQuestions.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`Question ${index + 1} must be an object.`);
      return;
    }

    const teamA = readString(raw.teamA);
    const teamB = readString(raw.teamB);
    const scenario = readString(raw.scenario);
    const explanation = readString(raw.explanation);
    const mechanicsFocus = readString(raw.mechanicsFocus);
    const correctChoiceId = readString(raw.correctChoiceId);
    const choices = Array.isArray(raw.choices) ? raw.choices : [];
    const difficulty = readString(raw.difficulty) as Difficulty;
    const conceptTags = Array.isArray(raw.conceptTags) ? raw.conceptTags : [];
    const lawReferences = Array.isArray(raw.lawReferences) ? raw.lawReferences : [];

    if (!teamA || !teamB) errors.push(`Question ${index + 1} must include both teams.`);
    if (teamA && teamB && teamA === teamB) errors.push(`Question ${index + 1} teams must differ.`);
    if (!scenario) errors.push(`Question ${index + 1} must include a scenario.`);
    if (!explanation) errors.push(`Question ${index + 1} must include feedback explanation.`);
    if (!mechanicsFocus) errors.push(`Question ${index + 1} must include mechanicsFocus.`);
    if (!DIFFICULTIES.has(difficulty)) errors.push(`Question ${index + 1} has invalid difficulty.`);

    const pairKey = [teamA, teamB].sort().join(" vs ").toLowerCase();
    if (pairKey.trim() && colorPairs.has(pairKey)) {
      errors.push(`Question ${index + 1} repeats team color pairing ${pairKey}.`);
    }
    colorPairs.add(pairKey);

    const bannedTerm = findBannedScenarioTerm(scenario);
    if (bannedTerm) {
      errors.push(`Question ${index + 1} scenario gives away "${bannedTerm}".`);
    }

    if (choices.length !== 4) {
      errors.push(`Question ${index + 1} must have exactly 4 choices.`);
    }

    const normalizedChoices = choices.flatMap((choice, choiceIndex) => {
      if (!isRecord(choice)) {
        errors.push(`Question ${index + 1} choice ${choiceIndex + 1} must be an object.`);
        return [];
      }
      const id = readString(choice.id) || String.fromCharCode(65 + choiceIndex);
      const text = readString(choice.text);
      if (!text) errors.push(`Question ${index + 1} choice ${choiceIndex + 1} needs text.`);
      if (VAGUE_CHOICE_PATTERNS.some((pattern) => pattern.test(text.trim()))) {
        errors.push(`Question ${index + 1} choice ${choiceIndex + 1} is too vague.`);
      }
      return [{ id, text }];
    });

    if (!normalizedChoices.some((choice) => choice.id === correctChoiceId)) {
      errors.push(`Question ${index + 1} correctChoiceId must match one choice id.`);
    }

    if (new Set(normalizedChoices.map((choice) => choice.id)).size !== normalizedChoices.length) {
      errors.push(`Question ${index + 1} choice ids must be unique.`);
    }

    const validConceptTags = conceptTags.filter((tag): tag is ConceptArea => CONCEPTS.has(tag));
    if (validConceptTags.length === 0) {
      errors.push(`Question ${index + 1} needs at least one valid concept tag.`);
    }

    const normalizedLawReferences = lawReferences
      .map((reference) => readString(reference))
      .filter(Boolean);
    if (normalizedLawReferences.length === 0) {
      errors.push(`Question ${index + 1} needs at least one law reference.`);
    }

    const correctAnswer = normalizedChoices.find((choice) => choice.id === correctChoiceId)?.text;
    const computedHash = questionFingerprint({ teamA, teamB, scenario, correctAnswer });
    const providedHash = readString(raw.questionHash);
    const questionHash = providedHash || computedHash;

    if (hashes.has(questionHash) || hashes.has(computedHash)) {
      errors.push(`Question ${index + 1} repeats a previously answered or generated scenario.`);
    }
    hashes.add(questionHash);
    hashes.add(computedHash);

    questions.push({
      id: readString(raw.id) || `q-${Date.now()}-${index}`,
      teamA,
      teamB,
      scenario,
      choices: normalizedChoices,
      correctChoiceId,
      explanation,
      conceptTags: validConceptTags,
      difficulty,
      lawReferences: normalizedLawReferences,
      mechanicsFocus,
      questionHash: computedHash
    });
  });

  return { ok: errors.length === 0, questions, errors };
}

export function findBannedScenarioTerm(scenario: string): string | null {
  const normalized = scenario.toLowerCase();
  return BANNED_SCENARIO_TERMS.find((term) => normalized.includes(term)) ?? null;
}

function extractQuestions(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.questions)) return value.questions;
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
