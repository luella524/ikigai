import { BAND_SCORES, type DimensionScores, type DimensionWeights } from "@/lib/types";

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "you",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "but",
  "not",
  "our",
  "their",
  "they",
  "them",
  "into",
  "about",
  "over",
  "what",
  "when",
  "where",
  "which",
  "will",
  "would",
  "could",
  "should",
  "been",
  "being",
  "also",
  "than",
  "then",
  "just",
  "very",
  "more",
  "most",
  "some",
  "any",
  "all",
  "can",
  "its",
  "who",
  "how",
  "why",
  "per",
  "via",
  "job",
  "role",
  "work",
  "working",
]);

export function tokens(text: string): string[] {
  const latin = (text.toLowerCase().match(/[a-z0-9][a-z0-9+/]{2,}/g) ?? []).filter(
    (token) => !STOP.has(token),
  );
  const cjk = text.match(/[\u4e00-\u9fff]{2,}/g) ?? [];
  return [...latin, ...cjk];
}

export function unique(list: string[]): string[] {
  return [...new Set(list)];
}

export function coverage(needles: string[], haystack: Set<string>): number {
  const items = unique(needles);
  if (items.length === 0) return 0;
  return items.filter((token) => haystack.has(token)).length / items.length;
}

/** Map a JEV level index onto one of the five band scores. No values between bands. */
export function bandScore(levelIndex: number): number {
  const last = BAND_SCORES.length - 1;
  const nearest = Math.round(Math.min(last, Math.max(0, levelIndex)));
  return BAND_SCORES[nearest] ?? 50;
}

export function ratioToBand(ratio: number): number {
  const clamped = Math.min(1, Math.max(0, ratio));
  return bandScore(clamped * (BAND_SCORES.length - 1));
}

export function textOverlap(source: string, target: string): number {
  const sourceTokens = unique(tokens(source));
  const targetTokens = unique(tokens(target));
  if (sourceTokens.length === 0 || targetTokens.length === 0) return 0;
  const sourceInTarget = coverage(sourceTokens, new Set(targetTokens));
  const targetInSource = coverage(targetTokens, new Set(sourceTokens));
  return Math.max(sourceInTarget, targetInSource);
}

/** Weighted average of band scores, rounded to the nearest 5. */
export function ikigaiFit(scores: DimensionScores, weights: DimensionWeights): number {
  const total = weights.love + weights.strength + weights.impact + weights.paid;
  if (total <= 0) return 0;
  const raw =
    (scores.love * weights.love +
      scores.strength * weights.strength +
      scores.impact * weights.impact +
      scores.paid * weights.paid) /
    total;
  const stepped = Math.round(raw / 5) * 5;
  return Math.min(100, Math.max(0, stepped));
}
