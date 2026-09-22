import { ikigaiGapHeadline } from "@/lib/caption";
import { ikigaiFit } from "@/lib/fit";
import { mockEvaluation } from "@/lib/mock-evaluation";
import type { IkigaiInput, IkigaiResult, JevEvaluation, RoleFit } from "@/lib/types";

function withFit(scores: JevEvaluation["current"], weights: IkigaiInput["ikigai"]["weights"]): RoleFit {
  return { ...scores, ikigaiFit: ikigaiFit(scores, weights) };
}

export function buildIkigaiResult(
  input: IkigaiInput,
  evaluation: JevEvaluation,
  source: IkigaiResult["source"],
): IkigaiResult {
  const current = withFit(evaluation.current, input.ikigai.weights);
  const ideal = withFit(evaluation.ideal, input.ikigai.weights);
  const ikigaiGap = ideal.ikigaiFit - current.ikigaiFit;
  return {
    current,
    ideal,
    ikigaiGap,
    summary: ikigaiGapHeadline(ikigaiGap),
    source,
  };
}

export function evaluateLocally(input: IkigaiInput): IkigaiResult {
  return buildIkigaiResult(input, mockEvaluation(input), "mock");
}
