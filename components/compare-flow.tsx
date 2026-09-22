"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LoadingAlignment } from "@/components/loading-alignment";
import {
  ENERGY_OPTIONS,
  FLEXIBILITY_OPTIONS,
  IMPACT_OPTIONS,
  SKILL_OPTIONS,
  STABILITY_OPTIONS,
  type DimensionKey,
  type EnergyOption,
  type FlexibilityOption,
  type IkigaiInput,
  type IkigaiResult,
  type ImpactOption,
  type StabilityOption,
} from "@/lib/types";
import { getDraftSnapshot, getServerDraftSnapshot, saveDraft, saveSession, subscribeDraft, type DraftState } from "@/lib/storage";
import { adjustWeight } from "@/lib/weights";
import { stepForErrors, validateFields, weightsTotal, type FieldErrors } from "@/lib/validate";

const STEPS = ["Your Ikigai", "Two roles"] as const;

const fieldClass =
  "w-full rounded-[20px] border border-mist bg-white/60 px-4 py-3 text-base text-ink outline-none placeholder:text-ink/40";
const idealFieldClass =
  "w-full rounded-[20px] border border-white bg-white px-4 py-3 text-base leading-6 text-ink caret-ink outline-none placeholder:text-ink/45 focus-visible:outline-white";

const WEIGHT_FIELDS: Array<{
  key: DimensionKey;
  draftKey: "weightLove" | "weightStrength" | "weightImpact" | "weightPaid";
  label: string;
}> = [
  { key: "love", draftKey: "weightLove", label: "Love" },
  { key: "strength", draftKey: "weightStrength", label: "Strength" },
  { key: "impact", draftKey: "weightImpact", label: "World / Impact" },
  { key: "paid", draftKey: "weightPaid", label: "Paid / Lifestyle" },
];

function skillsFromDraft(draft: DraftState): string[] {
  const custom = draft.customSkill.trim();
  const skills = [...draft.skills];
  if (custom && !skills.some((skill) => skill.toLowerCase() === custom.toLowerCase())) {
    skills.push(custom);
  }
  return skills;
}

function draftToInput(draft: DraftState): IkigaiInput {
  const compensation = (value: string) => value.trim() || undefined;
  return {
    name: draft.name.trim(),
    ikigai: {
      energy: draft.energy.filter((item): item is EnergyOption =>
        (ENERGY_OPTIONS as readonly string[]).includes(item),
      ),
      drains: draft.drains.trim(),
      skills: skillsFromDraft(draft),
      impactAreas: draft.impactAreas.filter((item): item is ImpactOption =>
        (IMPACT_OPTIONS as readonly string[]).includes(item),
      ),
      impactNote: draft.impactNote.trim(),
      minimumCompensation: draft.minimumCompensation.trim(),
      location: draft.location.trim(),
      stability: (STABILITY_OPTIONS as readonly string[]).includes(draft.stability)
        ? (draft.stability as StabilityOption)
        : "Balanced",
      flexibility: (FLEXIBILITY_OPTIONS as readonly string[]).includes(draft.flexibility)
        ? (draft.flexibility as FlexibilityOption)
        : "Balanced",
      weights: {
        love: draft.weightLove,
        strength: draft.weightStrength,
        impact: draft.weightImpact,
        paid: draft.weightPaid,
      },
    },
    currentRole: {
      title: draft.currentTitle.trim(),
      description: draft.currentDescription.trim(),
      compensation: compensation(draft.currentCompensation),
      flexibility: compensation(draft.currentFlexibility),
    },
    idealRole: {
      title: draft.idealTitle.trim(),
      description: draft.idealDescription.trim(),
      compensation: compensation(draft.idealCompensation),
      flexibility: compensation(draft.idealFlexibility),
    },
  };
}

function collectErrors(draft: DraftState): FieldErrors {
  const errors = validateFields(draftToInput(draft));
  if (!(STABILITY_OPTIONS as readonly string[]).includes(draft.stability)) {
    errors.stability = "Choose stability, balanced, or high upside.";
  }
  if (!(FLEXIBILITY_OPTIONS as readonly string[]).includes(draft.flexibility)) {
    errors.flexibility = "Choose a work-life flexibility preference.";
  }
  return errors;
}

function pickErrors(errors: FieldErrors, keys: Array<keyof FieldErrors>): FieldErrors {
  const next: FieldErrors = {};
  for (const key of keys) {
    if (errors[key]) next[key] = errors[key];
  }
  return next;
}

const STEP_ONE_KEYS: Array<keyof FieldErrors> = [
  "name",
  "energy",
  "drains",
  "skills",
  "impact",
  "minimumCompensation",
  "location",
  "stability",
  "flexibility",
  "weights",
];

export function CompareFlow() {
  const router = useRouter();
  const formId = useId();
  const draftSnapshot = useSyncExternalStore(subscribeDraft, getDraftSnapshot, getServerDraftSnapshot);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const draft = draftSnapshot.status === "ready" ? draftSnapshot.draft : null;

  function update(patch: Partial<DraftState>) {
    const current = getDraftSnapshot();
    if (current.status !== "ready") return;
    saveDraft({ ...current.draft, ...patch });
  }

  function toggleValue(key: "energy" | "skills" | "impactAreas", value: string, limit?: number) {
    const current = getDraftSnapshot();
    if (current.status !== "ready") return;
    const selected = current.draft[key].includes(value);
    const next = selected
      ? current.draft[key].filter((item) => item !== value)
      : limit && current.draft[key].length >= limit
        ? current.draft[key]
        : [...current.draft[key], value];
    saveDraft({ ...current.draft, [key]: next });
    setErrors((currentErrors) => ({
      ...currentErrors,
      energy: key === "energy" ? undefined : currentErrors.energy,
      skills: key === "skills" ? undefined : currentErrors.skills,
      impact: key === "impactAreas" ? undefined : currentErrors.impact,
    }));
  }

  function shiftWeight(key: DimensionKey, direction: 1 | -1) {
    if (!draft) return;
    const next = adjustWeight(
      {
        love: draft.weightLove,
        strength: draft.weightStrength,
        impact: draft.weightImpact,
        paid: draft.weightPaid,
      },
      key,
      direction,
    );
    update({
      weightLove: next.love,
      weightStrength: next.strength,
      weightImpact: next.impact,
      weightPaid: next.paid,
    });
  }

  function goNext() {
    if (!draft) return;
    const nextErrors = pickErrors(collectErrors(draft), STEP_ONE_KEYS);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setStep(1);
  }

  async function onSubmit() {
    if (!draft) return;
    const nextErrors = collectErrors(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStep(stepForErrors(nextErrors));
      setFormError("A few fields still need attention.");
      return;
    }

    const payload = draftToInput(draft);
    setLoading(true);
    setFormError("");
    const started = Date.now();
    if (process.env.NODE_ENV === "development") {
      console.info("[ikigai] normalized roles sent to the server", {
        currentRole: payload.currentRole,
        idealRole: payload.idealRole,
      });
    }
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "The evaluation could not be completed.";
        const fields =
          data && typeof data === "object" && "fields" in data && data.fields && typeof data.fields === "object"
            ? (data.fields as FieldErrors)
            : {};
        setErrors(fields);
        if (Object.keys(fields).length > 0) setStep(stepForErrors(fields));
        throw new Error(message);
      }
      const wait = 800 - (Date.now() - started);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      saveSession({ input: payload, result: data as IkigaiResult });
      router.push("/result");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The evaluation could not be completed.");
      setLoading(false);
    }
  }

  if (!draft) {
    return <div className="px-5 py-24 text-sm text-ink/60">Loading your draft…</div>;
  }

  const weights = {
    love: draft.weightLove,
    strength: draft.weightStrength,
    impact: draft.weightImpact,
    paid: draft.weightPaid,
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      {loading ? <LoadingAlignment /> : null}
      <p className="text-xs font-medium tracking-[0.2em] text-forest uppercase">
        {step === 0 ? "Step 1" : "Step 2"}
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">
        {step === 0 ? "Define your Ikigai" : "Compare two roles"}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-ink/75">
        {step === 0
          ? "Tell us what matters most in your next chapter."
          : "See which role better fits what matters to you."}
      </p>

      <nav aria-label="Comparison steps" className="mt-10">
        <ol className="grid grid-cols-2 gap-2">
          {STEPS.map((label, index) => {
            const active = index === step;
            const done = index < step;
            return (
              <li key={label}>
                <button
                  type="button"
                  className={`w-full rounded-[18px] border px-3 py-3 text-left ${
                    active
                      ? "border-forest bg-forest text-paper"
                      : done
                        ? "border-sage bg-white/50 text-ink"
                        : "border-mist text-ink/55"
                  }`}
                  aria-current={active ? "step" : undefined}
                  disabled={index > step}
                  onClick={() => {
                    if (index < step) setStep(index);
                  }}
                >
                  <span className="num block text-xs tracking-[0.14em] uppercase">0{index + 1}</span>
                  <span className="mt-1 block text-sm">{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {formError ? (
        <p className="mt-6 text-sm text-error" role="alert">
          {formError}
        </p>
      ) : null}

      {step === 0 ? (
        <section className="mt-10 grid gap-8" aria-labelledby={`${formId}-ikigai`}>
          <h2 id={`${formId}-ikigai`} className="sr-only">
            Define your Ikigai
          </h2>

          <div className="grid gap-2">
            <label htmlFor={`${formId}-name`} className="text-sm font-medium">
              Your name
            </label>
            <p className="text-sm leading-6 text-ink/70">This will appear on your Ikigai Career Card.</p>
            <input
              id={`${formId}-name`}
              value={draft.name}
              onChange={(event) => update({ name: event.target.value })}
              aria-invalid={Boolean(errors.name)}
              className={fieldClass}
              placeholder="Ella Lu"
              autoComplete="name"
            />
            {errors.name ? <p className="text-sm text-error">{errors.name}</p> : null}
          </div>

          <fieldset className="grid gap-4">
            <legend className="font-serif text-2xl tracking-tight">How much should each dimension count?</legend>
            <div className="grid gap-3">
              {WEIGHT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{field.label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Decrease ${field.label}`}
                      onClick={() => shiftWeight(field.key, -1)}
                      className="grid size-11 place-items-center rounded-full border border-mist text-lg text-ink"
                    >
                      −
                    </button>
                    <span className="num w-14 text-center text-sm">{weights[field.key]}%</span>
                    <button
                      type="button"
                      aria-label={`Increase ${field.label}`}
                      onClick={() => shiftWeight(field.key, 1)}
                      className="grid size-11 place-items-center rounded-full border border-mist text-lg text-ink"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="flex items-center justify-between text-sm text-forest">
              <span>Total</span>
              <span className="num">{weightsTotal(weights)}%</span>
            </p>
            {errors.weights ? <p className="text-sm text-error">{errors.weights}</p> : null}
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">What kind of work gives you energy?</legend>
            <div className="flex flex-wrap gap-2">
              {ENERGY_OPTIONS.map((option) => {
                const selected = draft.energy.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleValue("energy", option)}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      selected ? "border-forest bg-forest text-paper" : "border-mist bg-paper text-ink"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {errors.energy ? <p className="text-sm text-error">{errors.energy}</p> : null}
          </fieldset>

          <div className="grid gap-2">
            <label htmlFor={`${formId}-drains`} className="text-sm font-medium">
              What kind of work drains you?
            </label>
            <textarea
              id={`${formId}-drains`}
              value={draft.drains}
              onChange={(event) => update({ drains: event.target.value })}
              rows={3}
              className={fieldClass}
              placeholder="Quota cold calling, status meetings, work with no owner."
            />
            {errors.drains ? <p className="text-sm text-error">{errors.drains}</p> : null}
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">What are your strongest skills?</legend>
            <p className="text-sm leading-6 text-ink/70">Choose up to five. You can add your own.</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((option) => {
                const selected = draft.skills.includes(option);
                const locked = !selected && draft.skills.length >= 5;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    disabled={locked}
                    onClick={() => toggleValue("skills", option, 5)}
                    className={`rounded-full border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                      selected ? "border-forest bg-forest text-paper" : "border-mist bg-paper text-ink"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <label htmlFor={`${formId}-custom-skill`} className="text-sm font-medium">
              Add a skill
            </label>
            <input
              id={`${formId}-custom-skill`}
              value={draft.customSkill}
              onChange={(event) => update({ customSkill: event.target.value })}
              className={fieldClass}
              placeholder="Workshop facilitation"
            />
            {errors.skills ? <p className="text-sm text-error">{errors.skills}</p> : null}
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">What kind of work or problem do you want to contribute to?</legend>
            <div className="flex flex-wrap gap-2">
              {IMPACT_OPTIONS.map((option) => {
                const selected = draft.impactAreas.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleValue("impactAreas", option)}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      selected ? "border-forest bg-forest text-paper" : "border-mist bg-paper text-ink"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <label htmlFor={`${formId}-impact-note`} className="sr-only">
              Another problem you want to work on
            </label>
            <input
              id={`${formId}-impact-note`}
              value={draft.impactNote}
              onChange={(event) => update({ impactNote: event.target.value })}
              className={fieldClass}
              placeholder="Or describe it in your own words."
            />
            {errors.impact ? <p className="text-sm text-error">{errors.impact}</p> : null}
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="font-serif text-2xl tracking-tight">Paid / Lifestyle</legend>
            <div className="grid gap-2">
              <label htmlFor={`${formId}-pay`} className="text-sm font-medium">
                Minimum compensation range
              </label>
              <input
                id={`${formId}-pay`}
                value={draft.minimumCompensation}
                onChange={(event) => update({ minimumCompensation: event.target.value })}
                aria-invalid={Boolean(errors.minimumCompensation)}
                className={fieldClass}
                placeholder="$120–150k"
              />
              {errors.minimumCompensation ? (
                <p className="text-sm text-error">{errors.minimumCompensation}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor={`${formId}-location`} className="text-sm font-medium">
                Preferred location / remote flexibility
              </label>
              <input
                id={`${formId}-location`}
                value={draft.location}
                onChange={(event) => update({ location: event.target.value })}
                aria-invalid={Boolean(errors.location)}
                className={fieldClass}
                placeholder="Remote, or hybrid in New York"
              />
              {errors.location ? <p className="text-sm text-error">{errors.location}</p> : null}
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium">Stability versus high-upside preference</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Stability versus high upside">
                {STABILITY_OPTIONS.map((option) => {
                  const selected = draft.stability === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update({ stability: option })}
                      className={`rounded-full border px-4 py-2 text-sm ${
                        selected ? "border-forest bg-forest text-paper" : "border-mist bg-paper text-ink"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {errors.stability ? <p className="text-sm text-error">{errors.stability}</p> : null}
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium">Work-life flexibility preference</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Work-life flexibility">
                {FLEXIBILITY_OPTIONS.map((option) => {
                  const selected = draft.flexibility === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update({ flexibility: option })}
                      className={`rounded-full border px-4 py-2 text-sm ${
                        selected ? "border-forest bg-forest text-paper" : "border-mist bg-paper text-ink"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {errors.flexibility ? <p className="text-sm text-error">{errors.flexibility}</p> : null}
            </div>
          </fieldset>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="mt-10 grid gap-4 md:grid-cols-2" aria-labelledby={`${formId}-roles`}>
          <h2 id={`${formId}-roles`} className="sr-only">
            Compare two roles
          </h2>
          <div className="grid gap-4 rounded-[24px] border border-sage/80 bg-paper p-5">
            <h3 className="font-serif text-2xl">Current role</h3>
            <div className="grid gap-2">
              <label htmlFor={`${formId}-current-title`} className="text-sm font-medium">
                Job title
              </label>
              <input
                id={`${formId}-current-title`}
                value={draft.currentTitle}
                onChange={(event) => update({ currentTitle: event.target.value })}
                aria-invalid={Boolean(errors.currentTitle)}
                className={fieldClass}
                placeholder="Marketing Manager"
              />
              {errors.currentTitle ? <p className="text-sm text-error">{errors.currentTitle}</p> : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor={`${formId}-current-body`} className="text-sm font-medium">
                What do you actually do?
              </label>
              <textarea
                id={`${formId}-current-body`}
                value={draft.currentDescription}
                onChange={(event) => update({ currentDescription: event.target.value })}
                rows={7}
                aria-invalid={Boolean(errors.currentDescription)}
                className={fieldClass}
                placeholder="The work you do each week."
              />
              {errors.currentDescription ? (
                <p className="text-sm text-error">{errors.currentDescription}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor={`${formId}-current-pay`} className="text-sm font-medium">
                Current compensation range
              </label>
              <input
                id={`${formId}-current-pay`}
                value={draft.currentCompensation}
                onChange={(event) => update({ currentCompensation: event.target.value })}
                className={fieldClass}
                placeholder="Optional"
              />
              {errors.currentCompensation ? (
                <p className="text-sm text-error">{errors.currentCompensation}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor={`${formId}-current-flex`} className="text-sm font-medium">
                Current work-life / flexibility
              </label>
              <textarea
                id={`${formId}-current-flex`}
                value={draft.currentFlexibility}
                onChange={(event) => update({ currentFlexibility: event.target.value })}
                rows={3}
                className={fieldClass}
                placeholder="Optional"
              />
              {errors.currentFlexibility ? (
                <p className="text-sm text-error">{errors.currentFlexibility}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 rounded-[24px] border border-forest bg-forest p-5 text-paper">
            <h3 className="font-serif text-2xl">Ideal role</h3>
            <div className="grid gap-2">
              <label htmlFor={`${formId}-ideal-title`} className="text-sm font-medium">
                Job title
              </label>
              <input
                id={`${formId}-ideal-title`}
                value={draft.idealTitle}
                onChange={(event) => update({ idealTitle: event.target.value })}
                aria-invalid={Boolean(errors.idealTitle)}
                className={idealFieldClass}
                placeholder="Machine Learning Engineer"
              />
              {errors.idealTitle ? <p className="text-sm text-[#f3c7bb]">{errors.idealTitle}</p> : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor={`${formId}-ideal-body`} className="text-sm font-medium">
                Target job description or responsibilities
              </label>
              <textarea
                id={`${formId}-ideal-body`}
                value={draft.idealDescription}
                onChange={(event) => update({ idealDescription: event.target.value })}
                rows={7}
                aria-invalid={Boolean(errors.idealDescription)}
                className={idealFieldClass}
                placeholder="The work you want to be doing."
              />
              {errors.idealDescription ? (
                <p className="text-sm text-[#f3c7bb]">{errors.idealDescription}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor={`${formId}-ideal-pay`} className="text-sm font-medium">
                Expected compensation range
              </label>
              <input
                id={`${formId}-ideal-pay`}
                value={draft.idealCompensation}
                onChange={(event) => update({ idealCompensation: event.target.value })}
                className={idealFieldClass}
                placeholder="Optional"
              />
              {errors.idealCompensation ? (
                <p className="text-sm text-[#f3c7bb]">{errors.idealCompensation}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor={`${formId}-ideal-flex`} className="text-sm font-medium">
                Expected work-life / flexibility
              </label>
              <textarea
                id={`${formId}-ideal-flex`}
                value={draft.idealFlexibility}
                onChange={(event) => update({ idealFlexibility: event.target.value })}
                rows={3}
                className={idealFieldClass}
                placeholder="Optional"
              />
              {errors.idealFlexibility ? (
                <p className="text-sm text-[#f3c7bb]">{errors.idealFlexibility}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="rounded-[18px] border border-mist px-5 py-3 text-sm text-ink"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {step === 0 ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-[18px] bg-forest px-5 py-3 text-sm font-medium text-paper hover:bg-[#1d3e33]"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              void onSubmit();
            }}
            disabled={loading}
            className="rounded-[18px] bg-forest px-5 py-3 text-sm font-medium text-paper hover:bg-[#1d3e33] disabled:opacity-60"
          >
            Compare My Jobs
          </button>
        )}
      </div>
    </div>
  );
}
