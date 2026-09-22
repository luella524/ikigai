import type { IkigaiInput, IkigaiResult } from "@/lib/types";
import { DEFAULT_WEIGHTS, SKILL_OPTIONS } from "@/lib/types";

const SESSION_KEY = "ikigai.session.v4";
const DRAFT_KEY = "ikigai.draft.v3";

export type StoredSession = {
  input: IkigaiInput;
  result: IkigaiResult;
};

export type DraftState = {
  name: string;
  energy: string[];
  drains: string;
  skills: string[];
  customSkill: string;
  impactAreas: string[];
  impactNote: string;
  minimumCompensation: string;
  location: string;
  stability: string;
  flexibility: string;
  weightLove: number;
  weightStrength: number;
  weightImpact: number;
  weightPaid: number;
  currentTitle: string;
  currentDescription: string;
  currentCompensation: string;
  currentFlexibility: string;
  idealTitle: string;
  idealDescription: string;
  idealCompensation: string;
  idealFlexibility: string;
};

export const EMPTY_DRAFT: DraftState = {
  name: "",
  energy: [],
  drains: "",
  skills: [],
  customSkill: "",
  impactAreas: [],
  impactNote: "",
  minimumCompensation: "",
  location: "",
  stability: "",
  flexibility: "",
  weightLove: DEFAULT_WEIGHTS.love,
  weightStrength: DEFAULT_WEIGHTS.strength,
  weightImpact: DEFAULT_WEIGHTS.impact,
  weightPaid: DEFAULT_WEIGHTS.paid,
  currentTitle: "",
  currentDescription: "",
  currentCompensation: "",
  currentFlexibility: "",
  idealTitle: "",
  idealDescription: "",
  idealCompensation: "",
  idealFlexibility: "",
};

export type SessionSnapshot =
  | { status: "pending" }
  | { status: "empty" }
  | { status: "ready"; session: StoredSession };

export type DraftSnapshot = { status: "pending" } | { status: "ready"; draft: DraftState };

const SESSION_PENDING: SessionSnapshot = { status: "pending" };
const SESSION_EMPTY: SessionSnapshot = { status: "empty" };
const DRAFT_PENDING: DraftSnapshot = { status: "pending" };
const DRAFT_EMPTY: DraftSnapshot = { status: "ready", draft: EMPTY_DRAFT };

const sessionListeners = new Set<() => void>();
const draftListeners = new Set<() => void>();

let sessionRaw: string | null | undefined;
let sessionSnapshot: SessionSnapshot = SESSION_EMPTY;
let draftRaw: string | null | undefined;
let draftSnapshot: DraftSnapshot = DRAFT_EMPTY;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeDraft(value: Partial<DraftState>): DraftState {
  const draft = { ...EMPTY_DRAFT, ...value };
  const skillOptions = new Set<string>(SKILL_OPTIONS);
  draft.energy = stringList(value.energy);
  draft.skills = stringList(value.skills).filter((skill) => skillOptions.has(skill));
  draft.impactAreas = stringList(value.impactAreas);
  const weights = ["weightLove", "weightStrength", "weightImpact", "weightPaid"] as const;
  for (const key of weights) {
    const number = Number(draft[key]);
    draft[key] = Number.isFinite(number) ? Math.round(Math.min(100, Math.max(0, number))) : EMPTY_DRAFT[key];
  }
  const total = draft.weightLove + draft.weightStrength + draft.weightImpact + draft.weightPaid;
  const stepped = weights.every((key) => draft[key] % 5 === 0);
  if (total !== 100 || !stepped) {
    draft.weightLove = EMPTY_DRAFT.weightLove;
    draft.weightStrength = EMPTY_DRAFT.weightStrength;
    draft.weightImpact = EMPTY_DRAFT.weightImpact;
    draft.weightPaid = EMPTY_DRAFT.weightPaid;
  }
  return draft;
}

function isSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== "object") return false;
  const session = value as StoredSession;
  return (
    typeof session.result?.current?.ikigaiFit === "number" &&
    typeof session.result?.ideal?.ikigaiFit === "number" &&
    typeof session.result?.ikigaiGap === "number" &&
    typeof session.input?.name === "string" &&
    typeof session.input?.currentRole?.title === "string" &&
    typeof session.input?.ikigai?.weights?.love === "number"
  );
}

function readSessionRaw(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(SESSION_KEY);
}

function readDraftRaw(): string | null {
  if (!canUseStorage()) return null;
  return window.sessionStorage.getItem(DRAFT_KEY);
}

export function subscribeSession(onStoreChange: () => void): () => void {
  sessionListeners.add(onStoreChange);
  return () => sessionListeners.delete(onStoreChange);
}

export function getServerSessionSnapshot(): SessionSnapshot {
  return SESSION_PENDING;
}

export function getSessionSnapshot(): SessionSnapshot {
  const raw = readSessionRaw();
  if (raw === sessionRaw) return sessionSnapshot;
  sessionRaw = raw;
  if (!raw) {
    sessionSnapshot = SESSION_EMPTY;
    return sessionSnapshot;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    sessionSnapshot = isSession(parsed) ? { status: "ready", session: parsed } : SESSION_EMPTY;
  } catch {
    sessionSnapshot = SESSION_EMPTY;
  }
  return sessionSnapshot;
}

export function saveSession(session: StoredSession): void {
  if (!canUseStorage()) return;
  const raw = JSON.stringify(session);
  window.localStorage.setItem(SESSION_KEY, raw);
  sessionRaw = raw;
  sessionSnapshot = { status: "ready", session };
  sessionListeners.forEach((listener) => listener());
}

export function subscribeDraft(onStoreChange: () => void): () => void {
  draftListeners.add(onStoreChange);
  return () => draftListeners.delete(onStoreChange);
}

export function getServerDraftSnapshot(): DraftSnapshot {
  return DRAFT_PENDING;
}

export function getDraftSnapshot(): DraftSnapshot {
  const raw = readDraftRaw();
  if (raw === draftRaw) return draftSnapshot;
  draftRaw = raw;
  if (!raw) {
    draftSnapshot = DRAFT_EMPTY;
    return draftSnapshot;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      draftSnapshot = DRAFT_EMPTY;
      return draftSnapshot;
    }
    draftSnapshot = { status: "ready", draft: normalizeDraft(parsed as Partial<DraftState>) };
  } catch {
    draftSnapshot = DRAFT_EMPTY;
  }
  return draftSnapshot;
}

export function saveDraft(draft: DraftState): void {
  if (!canUseStorage()) return;
  const raw = JSON.stringify(draft);
  window.sessionStorage.setItem(DRAFT_KEY, raw);
  draftRaw = raw;
  draftSnapshot = { status: "ready", draft };
  draftListeners.forEach((listener) => listener());
}
