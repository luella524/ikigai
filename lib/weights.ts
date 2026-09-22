import {
  WEIGHT_STEP,
  type DimensionKey,
  type DimensionWeights,
} from "@/lib/types";

const KEYS: DimensionKey[] = ["love", "strength", "impact", "paid"];

export function adjustWeight(
  weights: DimensionWeights,
  key: DimensionKey,
  direction: 1 | -1,
): DimensionWeights {
  const next = { ...weights };
  if (direction === 1) {
    if (next[key] + WEIGHT_STEP > 100) return weights;
    const donor = KEYS.filter((item) => item !== key && next[item] >= WEIGHT_STEP).sort(
      (a, b) => next[b] - next[a] || KEYS.indexOf(a) - KEYS.indexOf(b),
    )[0];
    if (!donor) return weights;
    next[key] += WEIGHT_STEP;
    next[donor] -= WEIGHT_STEP;
    return next;
  }

  if (next[key] - WEIGHT_STEP < 0) return weights;
  const receiver = KEYS.filter((item) => item !== key && next[item] + WEIGHT_STEP <= 100).sort(
    (a, b) => next[a] - next[b] || KEYS.indexOf(a) - KEYS.indexOf(b),
  )[0];
  if (!receiver) return weights;
  next[key] -= WEIGHT_STEP;
  next[receiver] += WEIGHT_STEP;
  return next;
}
