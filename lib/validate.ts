import {
  ENERGY_OPTIONS,
  FLEXIBILITY_OPTIONS,
  IMPACT_OPTIONS,
  STABILITY_OPTIONS,
  WEIGHT_STEP,
  type DimensionKey,
  type DimensionWeights,
  type EnergyOption,
  type FlexibilityOption,
  type IkigaiDefinition,
  type IkigaiInput,
  type ImpactOption,
  type StabilityOption,
} from "@/lib/types";
import { DEFAULT_WEIGHTS } from "@/lib/types";

export type FieldErrors = Partial<
  Record<
    | "name"
    | "energy"
    | "drains"
    | "skills"
    | "impact"
    | "minimumCompensation"
    | "location"
    | "stability"
    | "flexibility"
    | "weights"
    | "currentTitle"
    | "currentDescription"
    | "currentCompensation"
    | "currentFlexibility"
    | "idealTitle"
    | "idealDescription"
    | "idealCompensation"
    | "idealFlexibility",
    string
  >
>;

const LIMITS = {
  name: 80,
  drains: 500,
  skill: 40,
  impactNote: 240,
  preference: 160,
  title: 120,
  description: 8000,
} as const;

const WEIGHT_KEYS: DimensionKey[] = ["love", "strength", "impact", "paid"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readWeight(value: unknown, fallback: number): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.round(Math.min(100, Math.max(0, number)));
}

function readWeights(value: unknown): DimensionWeights {
  const record = isRecord(value) ? value : {};
  return {
    love: readWeight(record.love, DEFAULT_WEIGHTS.love),
    strength: readWeight(record.strength, DEFAULT_WEIGHTS.strength),
    impact: readWeight(record.impact, DEFAULT_WEIGHTS.impact),
    paid: readWeight(record.paid, DEFAULT_WEIGHTS.paid),
  };
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(readString).filter(Boolean))];
}

export function weightsTotal(weights: DimensionWeights): number {
  return WEIGHT_KEYS.reduce((total, key) => total + weights[key], 0);
}

function optionalLength(value: string | undefined, max: number, key: keyof FieldErrors, label: string, errors: FieldErrors) {
  if ((value?.length ?? 0) > max) {
    errors[key] = `Shorten the ${label}.`;
  }
}

export function validateFields(input: IkigaiInput): FieldErrors {
  const errors: FieldErrors = {};
  const ikigai = input.ikigai;

  if (!input.name.trim()) {
    errors.name = "Add your name. It appears on your Ikigai Career Card.";
  } else if (input.name.length > LIMITS.name) {
    errors.name = "Use a shorter name.";
  }

  if (ikigai.energy.length === 0) {
    errors.energy = "Choose at least one kind of work that gives you energy.";
  }

  if (ikigai.drains.length > LIMITS.drains) {
    errors.drains = "Shorten the work that drains you.";
  }

  if (ikigai.skills.length === 0) {
    errors.skills = "Choose at least one skill.";
  } else if (ikigai.skills.length > 5) {
    errors.skills = "Choose up to five skills.";
  } else if (ikigai.skills.some((skill) => skill.length > LIMITS.skill)) {
    errors.skills = "Use shorter skill names.";
  }

  if (ikigai.impactAreas.length === 0 && ikigai.impactNote.trim().length < 8) {
    errors.impact = "Choose a focus, or describe the problem you want to work on.";
  } else if (ikigai.impactNote.length > LIMITS.impactNote) {
    errors.impact = "Shorten the problem you want to work on.";
  }

  if (ikigai.minimumCompensation.trim().length < 2) {
    errors.minimumCompensation = "Add a minimum compensation range.";
  } else if (ikigai.minimumCompensation.length > LIMITS.preference) {
    errors.minimumCompensation = "Shorten the compensation range.";
  }

  if (ikigai.location.trim().length < 2) {
    errors.location = "Add a location or remote preference.";
  } else if (ikigai.location.length > LIMITS.preference) {
    errors.location = "Shorten the location preference.";
  }

  if (!STABILITY_OPTIONS.includes(ikigai.stability)) {
    errors.stability = "Choose stability, balanced, or high upside.";
  }

  if (!FLEXIBILITY_OPTIONS.includes(ikigai.flexibility)) {
    errors.flexibility = "Choose a work-life flexibility preference.";
  }

  const total = weightsTotal(ikigai.weights);
  const stepped = WEIGHT_KEYS.every((key) => ikigai.weights[key] % WEIGHT_STEP === 0);
  if (total !== 100 || !stepped) {
    errors.weights = "The four weights need to add up to 100%.";
  }

  if (!input.currentRole.title.trim()) {
    errors.currentTitle = "Add your current job title.";
  } else if (input.currentRole.title.length > LIMITS.title) {
    errors.currentTitle = "Use a shorter current job title.";
  }

  if (input.currentRole.description.trim().length < 20) {
    errors.currentDescription = "Describe what you actually do.";
  } else if (input.currentRole.description.length > LIMITS.description) {
    errors.currentDescription = "Shorten the current role description.";
  }

  optionalLength(input.currentRole.compensation, LIMITS.preference, "currentCompensation", "current compensation", errors);
  optionalLength(input.currentRole.flexibility, LIMITS.preference, "currentFlexibility", "current work-life notes", errors);

  if (!input.idealRole.title.trim()) {
    errors.idealTitle = "Add the title of the role you want.";
  } else if (input.idealRole.title.length > LIMITS.title) {
    errors.idealTitle = "Use a shorter ideal job title.";
  }

  if (input.idealRole.description.trim().length < 20) {
    errors.idealDescription = "Describe the role you want, or paste a target job description.";
  } else if (input.idealRole.description.length > LIMITS.description) {
    errors.idealDescription = "Shorten the ideal role description.";
  }

  optionalLength(input.idealRole.compensation, LIMITS.preference, "idealCompensation", "expected compensation", errors);
  optionalLength(input.idealRole.flexibility, LIMITS.preference, "idealFlexibility", "expected work-life notes", errors);

  return errors;
}

function readRole(value: unknown) {
  const role = isRecord(value) ? value : {};
  const compensation = readString(role.compensation);
  const flexibility = readString(role.flexibility);
  return {
    title: readString(role.title),
    description: readString(role.description),
    compensation: compensation || undefined,
    flexibility: flexibility || undefined,
  };
}

function readIkigai(body: Record<string, unknown>): IkigaiDefinition {
  const ikigai = isRecord(body.ikigai) ? body.ikigai : {};
  const energy = uniqueStrings(ikigai.energy).filter((item): item is EnergyOption =>
    (ENERGY_OPTIONS as readonly string[]).includes(item),
  );
  const impactAreas = uniqueStrings(ikigai.impactAreas).filter((item): item is ImpactOption =>
    (IMPACT_OPTIONS as readonly string[]).includes(item),
  );
  const stability = readString(ikigai.stability);
  const flexibility = readString(ikigai.flexibility);
  return {
    energy,
    drains: readString(ikigai.drains),
    skills: uniqueStrings(ikigai.skills).slice(0, 5),
    impactAreas,
    impactNote: readString(ikigai.impactNote),
    minimumCompensation: readString(ikigai.minimumCompensation),
    location: readString(ikigai.location),
    stability: (STABILITY_OPTIONS as readonly string[]).includes(stability)
      ? (stability as StabilityOption)
      : "Balanced",
    flexibility: (FLEXIBILITY_OPTIONS as readonly string[]).includes(flexibility)
      ? (flexibility as FlexibilityOption)
      : "Balanced",
    weights: readWeights(ikigai.weights),
  };
}

export function parseInput(
  body: unknown,
): { ok: true; value: IkigaiInput } | { ok: false; error: string; fields: FieldErrors } {
  if (!isRecord(body)) {
    return { ok: false, error: "Send your comparison as JSON.", fields: {} };
  }

  const value: IkigaiInput = {
    name: readString(body.name),
    ikigai: readIkigai(body),
    currentRole: readRole(body.currentRole),
    idealRole: readRole(body.idealRole),
  };

  const fields = validateFields(value);
  if (!(STABILITY_OPTIONS as readonly string[]).includes(readString(isRecord(body.ikigai) ? body.ikigai.stability : ""))) {
    fields.stability = "Choose stability, balanced, or high upside.";
  }
  if (!(FLEXIBILITY_OPTIONS as readonly string[]).includes(readString(isRecord(body.ikigai) ? body.ikigai.flexibility : ""))) {
    fields.flexibility = "Choose a work-life flexibility preference.";
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      error: "Add the missing Ikigai details and role descriptions, then compare again.",
      fields,
    };
  }

  return { ok: true, value };
}

export function stepForErrors(fields: FieldErrors): number {
  if (
    fields.name ||
    fields.energy ||
    fields.drains ||
    fields.skills ||
    fields.impact ||
    fields.minimumCompensation ||
    fields.location ||
    fields.stability ||
    fields.flexibility ||
    fields.weights
  ) {
    return 0;
  }
  return 1;
}
