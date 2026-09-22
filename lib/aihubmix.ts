import { bandScore } from "@/lib/fit";
import { buildIkigaiResult, evaluateLocally } from "@/lib/interpret";
import { buildScoreRequest } from "@/lib/questions";
import {
  ALIGNMENT_LEVELS,
  BAND_SCORES,
  type DimensionKey,
  type DimensionScores,
  type IkigaiInput,
  type IkigaiResult,
  type JevEvaluation,
} from "@/lib/types";

const DEFAULT_BASE_URL = "https://aihubmix.com";
const DEFAULT_MODEL = "jev-latest";

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class EvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationError";
  }
}

type SystemOneQuestion = {
  type: "score";
  instructions: string;
  criteria: string[];
};

type SystemOneScoreAnswer = {
  type: "score";
  score: number;
};

type SystemOneResponse = {
  answers?: Record<string, SystemOneScoreAnswer | { type: string }>;
};

function apiKey(): string | undefined {
  const key = process.env.AIHUBMIX_API_KEY?.trim();
  return key || undefined;
}

function baseUrl(): string {
  return (process.env.AIHUBMIX_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function modelId(): string {
  return process.env.AIHUBMIX_JEV_MODEL?.trim() || DEFAULT_MODEL;
}

function failureMessage(status: number): string {
  if (status === 401) return "The AIHubMix API key was rejected. Check AIHUBMIX_API_KEY.";
  if (status === 403) return "This AIHubMix key cannot use JEV, or the account is out of credit.";
  if (status === 429) return "AIHubMix is rate limiting this key. Try again in a moment.";
  if (status === 422) return "JEV rejected the evaluation request.";
  if (status === 503 || status === 529) return "JEV is unavailable right now. Try again in a moment.";
  return `JEV could not complete the evaluation (${status}).`;
}

const SCORE_IDS: Array<{ which: "current" | "ideal"; key: DimensionKey }> = [
  { which: "current", key: "love" },
  { which: "current", key: "strength" },
  { which: "current", key: "impact" },
  { which: "current", key: "paid" },
  { which: "ideal", key: "love" },
  { which: "ideal", key: "strength" },
  { which: "ideal", key: "impact" },
  { which: "ideal", key: "paid" },
];

function readScore(answers: SystemOneResponse["answers"], id: string): number {
  const answer = answers?.[id];
  if (!answer || answer.type !== "score" || typeof (answer as SystemOneScoreAnswer).score !== "number") {
    throw new EvaluationError("JEV returned an incomplete score.");
  }
  return bandScore((answer as SystemOneScoreAnswer).score);
}

function mapScores(answers: SystemOneResponse["answers"]): JevEvaluation {
  const current = { love: 0, strength: 0, impact: 0, paid: 0 };
  const ideal = { love: 0, strength: 0, impact: 0, paid: 0 };
  for (const item of SCORE_IDS) {
    const bucket = item.which === "current" ? current : ideal;
    bucket[item.key] = readScore(answers, `${item.which}_${item.key}`);
  }
  return { current, ideal };
}

async function callSystemOne(input: IkigaiInput): Promise<JevEvaluation> {
  const key = apiKey();
  if (!key) {
    throw new ConfigurationError("Set AIHUBMIX_API_KEY on the server.");
  }
  if (BAND_SCORES.length !== ALIGNMENT_LEVELS.length) {
    throw new EvaluationError("Alignment bands are out of sync with the JEV score scale.");
  }

  const request = buildScoreRequest(input);
  const questions: Record<string, SystemOneQuestion> = {};
  for (const question of request.questions) {
    questions[question.id] = {
      type: "score",
      instructions: question.question,
      criteria: [...question.scale.levels],
    };
  }

  const response = await fetch(`${baseUrl()}/v1/systemone`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: modelId(), state: request.state, questions }),
    signal: AbortSignal.timeout(45_000),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new EvaluationError(failureMessage(response.status));
  }

  let payload: SystemOneResponse;
  try {
    payload = JSON.parse(text) as SystemOneResponse;
  } catch {
    throw new EvaluationError("JEV returned a response that was not JSON.");
  }

  const dimensions: { current: DimensionScores; ideal: DimensionScores } = mapScores(payload.answers);
  if (process.env.NODE_ENV !== "production") {
    console.info("[ikigai] JEV dimension scores", dimensions);
  }
  return dimensions;
}

/**
 * Evaluates both roles with AIHubMix Run JEV Score (`POST /v1/systemone`).
 * Official contract: https://aihubmix.com/model/jev-latest/llms.txt
 * Ikigai Fit and the Ikigai Gap are calculated in this app from the eight scores.
 */
export async function runJevEvaluation(input: IkigaiInput): Promise<IkigaiResult> {
  if (!apiKey()) {
    if (process.env.NODE_ENV === "production") {
      throw new ConfigurationError(
        "Ikigai evaluation is not configured. Set AIHUBMIX_API_KEY on the server.",
      );
    }
    return evaluateLocally(input);
  }

  const evaluation = await callSystemOne(input);
  return buildIkigaiResult(input, evaluation, "jev");
}
