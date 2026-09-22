export function ikigaiGapHeadline(gap: number): string {
  if (gap > 0) {
    const points = gap === 1 ? "point" : "points";
    return `Your ideal role is ${gap} ${points} closer to your Ikigai.`;
  }
  if (gap < 0) {
    return "Your current role fits more of your priorities today.";
  }
  return "Your current role and ideal role have the same Ikigai Fit.";
}

export function signedDelta(current: number, ideal: number): string {
  const diff = ideal - current;
  if (diff > 0) return `+${diff}`;
  return String(diff);
}
