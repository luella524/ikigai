export const ENERGY_OPTIONS = [
  "Building relationships",
  "Creating and storytelling",
  "Solving complex problems",
  "Negotiating and closing deals",
  "Leading teams",
  "Working with technology",
  "Teaching and helping others",
  "Strategy and research",
] as const;

export const SKILL_OPTIONS = [
  "Strategic thinking",
  "Problem solving",
  "Communication",
  "Leadership",
  "Relationship building",
  "Sales & negotiation",
  "Product thinking",
  "Software development",
  "Data analysis",
  "Research",
  "Financial analysis",
  "Design",
  "Writing & storytelling",
  "Marketing / GTM",
  "Partnerships",
  "Project management",
  "Operations",
  "Process improvement",
  "Creative thinking",
  "Teaching & mentoring",
] as const;

export const IMPACT_OPTIONS = [
  "AI and technology",
  "Creativity and media",
  "Education",
  "Healthcare",
  "Climate",
  "Small-business growth",
  "Community and belonging",
  "Consumer products",
] as const;

export const STABILITY_OPTIONS = ["Stability", "Balanced", "High upside"] as const;

export const FLEXIBILITY_OPTIONS = ["Clear boundaries", "Balanced", "High flexibility"] as const;

export const ALIGNMENT_LEVELS = [
  "0–20: Strong misalignment",
  "21–40: Weak alignment",
  "41–60: Partial alignment",
  "61–80: Strong alignment",
  "81–100: Exceptional alignment",
] as const;

export const BAND_SCORES = [10, 30, 50, 70, 90] as const;

export type EnergyOption = (typeof ENERGY_OPTIONS)[number];
export type SkillOption = (typeof SKILL_OPTIONS)[number];
export type ImpactOption = (typeof IMPACT_OPTIONS)[number];
export type StabilityOption = (typeof STABILITY_OPTIONS)[number];
export type FlexibilityOption = (typeof FLEXIBILITY_OPTIONS)[number];

export type DimensionKey = "love" | "strength" | "impact" | "paid";

export type DimensionWeights = Record<DimensionKey, number>;

export type RoleInput = {
  title: string;
  description: string;
  compensation?: string;
  flexibility?: string;
};

export type IkigaiDefinition = {
  energy: EnergyOption[];
  drains: string;
  skills: string[];
  impactAreas: ImpactOption[];
  impactNote: string;
  minimumCompensation: string;
  location: string;
  stability: StabilityOption;
  flexibility: FlexibilityOption;
  weights: DimensionWeights;
};

export type IkigaiInput = {
  name: string;
  ikigai: IkigaiDefinition;
  currentRole: RoleInput;
  idealRole: RoleInput;
};

export type DimensionScores = Record<DimensionKey, number>;

export type RoleFit = DimensionScores & {
  ikigaiFit: number;
};

export type IkigaiResult = {
  current: RoleFit;
  ideal: RoleFit;
  ikigaiGap: number;
  summary: string;
  source: "mock" | "jev";
};

export type ScoreQuestion = {
  type: "score";
  id: string;
  target: "currentRole" | "idealRole";
  question: string;
  scale: {
    min: 0;
    max: 100;
    levels: typeof ALIGNMENT_LEVELS;
  };
};

export type IkigaiEvaluationRequest = {
  state: IkigaiInput;
  questions: ScoreQuestion[];
};

export type JevEvaluation = {
  current: DimensionScores;
  ideal: DimensionScores;
};

export const DEFAULT_WEIGHTS: DimensionWeights = {
  love: 25,
  strength: 25,
  impact: 25,
  paid: 25,
};

export const WEIGHT_STEP = 5;

export const LENSES = [
  { key: "love", label: "Love", phrase: "What you love", color: "#E97A5F" },
  { key: "strength", label: "Strength", phrase: "What you’re good at", color: "#A7B9A7" },
  { key: "impact", label: "World / Impact", phrase: "The problem you want to work on", color: "#7B9DB8" },
  { key: "paid", label: "Paid / Lifestyle", phrase: "The life the work needs to support", color: "#D7AB4C" },
] as const;

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
export const CARD_DOMAIN = "ikigai.career";
