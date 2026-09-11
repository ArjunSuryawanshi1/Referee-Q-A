export function normalizeForHash(value: string): string {
  return value
    .toLowerCase()
    .replace(/team\s+/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function hashString(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

export function questionFingerprint(input: {
  teamA?: string;
  teamB?: string;
  scenario: string;
  correctAnswer?: string;
}): string {
  return hashString(
    normalizeForHash(
      [input.teamA, input.teamB, input.scenario, input.correctAnswer].filter(Boolean).join(" ")
    )
  );
}
