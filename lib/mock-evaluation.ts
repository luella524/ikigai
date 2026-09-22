import { ratioToBand, textOverlap } from "@/lib/fit";
import type { DimensionScores, IkigaiInput, JevEvaluation, RoleInput } from "@/lib/types";

function roleText(role: RoleInput): string {
  return [role.title, role.description, role.compensation ?? "", role.flexibility ?? ""].join("\n");
}

function loveScore(input: IkigaiInput, role: RoleInput): number {
  const text = roleText(role);
  let score = ratioToBand(textOverlap(input.ikigai.energy.join(" "), text));
  if (input.ikigai.drains && textOverlap(input.ikigai.drains, text) >= 0.34) {
    score = Math.max(10, score - 20);
  }
  return score;
}

function strengthScore(input: IkigaiInput, role: RoleInput): number {
  return ratioToBand(textOverlap(input.ikigai.skills.join(" "), roleText(role)));
}

function impactScore(input: IkigaiInput, role: RoleInput): number {
  const focus = [...input.ikigai.impactAreas, input.ikigai.impactNote].filter(Boolean).join(" ");
  return ratioToBand(textOverlap(focus, roleText(role)));
}

function paidScore(input: IkigaiInput, role: RoleInput): number {
  const text = roleText(role);
  const prefs = [
    input.ikigai.minimumCompensation,
    input.ikigai.location,
    input.ikigai.stability,
    input.ikigai.flexibility,
  ];
  const parts = prefs.map((preference) => {
    const hit = textOverlap(preference, text);
    return hit > 0 ? hit : 0.5;
  });
  const average = parts.reduce((total, value) => total + value, 0) / parts.length;
  return ratioToBand(average);
}

function scoreRole(input: IkigaiInput, role: RoleInput): DimensionScores {
  return {
    love: loveScore(input, role),
    strength: strengthScore(input, role),
    impact: impactScore(input, role),
    paid: paidScore(input, role),
  };
}

export function mockEvaluation(input: IkigaiInput): JevEvaluation {
  return {
    current: scoreRole(input, input.currentRole),
    ideal: scoreRole(input, input.idealRole),
  };
}
