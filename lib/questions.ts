import {
  ALIGNMENT_LEVELS,
  type DimensionKey,
  type IkigaiEvaluationRequest,
  type IkigaiInput,
  type RoleInput,
  type ScoreQuestion,
} from "@/lib/types";

const SCALE = {
  min: 0,
  max: 100,
  levels: ALIGNMENT_LEVELS,
} as const;

function roleBrief(role: RoleInput): string {
  return [
    `Role title: ${role.title}.`,
    `What this role does: ${role.description}.`,
    role.compensation ? `Compensation noted for this role: ${role.compensation}.` : "",
    role.flexibility ? `Work-life notes for this role: ${role.flexibility}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function roleScope(which: "current" | "ideal", role: RoleInput, ask: string): string {
  const named = which === "current" ? "Current Role" : "Ideal Role";
  const other = which === "current" ? "Ideal Role" : "Current Role";
  return [
    `Evaluate ONLY the ${named}.`,
    `Ignore the ${other} completely.`,
    "Do not score the person in general.",
    "Do not use résumé evidence, transition difficulty, or job-market guesses.",
    roleBrief(role),
    ask,
  ].join(" ");
}

const ASKS: Array<{ key: DimensionKey; ask: (input: IkigaiInput) => string }> = [
  {
    key: "love",
    ask: (input) =>
      `The user gets energy from: ${input.ikigai.energy.join(", ")}. Work that drains them: ${input.ikigai.drains || "none stated"}. Rate how well this role matches those stated sources of energy and stated work drains.`,
  },
  {
    key: "strength",
    ask: (input) =>
      `The user's strongest skills: ${input.ikigai.skills.join(", ")}. Rate how well this role uses those stated skills.`,
  },
  {
    key: "impact",
    ask: (input) => {
      const focus = [...input.ikigai.impactAreas, input.ikigai.impactNote].filter(Boolean).join("; ");
      return `The user wants to contribute to: ${focus}. Rate how well this role matches that stated focus. Do not use external labor-market data.`;
    },
  },
  {
    key: "paid",
    ask: (input) =>
      [
        `Minimum compensation: ${input.ikigai.minimumCompensation}.`,
        `Preferred location or remote flexibility: ${input.ikigai.location}.`,
        `Stability versus high-upside preference: ${input.ikigai.stability}.`,
        `Work-life flexibility preference: ${input.ikigai.flexibility}.`,
        "Rate how well this role, as described, fits those stated compensation and lifestyle preferences.",
        "Do not look up salaries or labor-market data.",
        "If the description is silent on pay, do not treat that silence as a poor fit.",
      ].join(" "),
  },
];

export function buildScoreRequest(input: IkigaiInput): IkigaiEvaluationRequest {
  const questions: ScoreQuestion[] = [];
  for (const which of ["current", "ideal"] as const) {
    const role = which === "current" ? input.currentRole : input.idealRole;
    for (const dimension of ASKS) {
      questions.push({
        type: "score",
        id: `${which}_${dimension.key}`,
        target: which === "current" ? "currentRole" : "idealRole",
        question: roleScope(which, role, dimension.ask(input)),
        scale: SCALE,
      });
    }
  }

  const ids = questions.map((question) => question.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("JEV score questions must have unique ids.");
  }

  return { state: input, questions };
}
