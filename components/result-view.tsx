"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSyncExternalStore } from "react";
import { MissingResult } from "@/components/missing-result";
import { signedDelta } from "@/lib/caption";
import { getServerSessionSnapshot, getSessionSnapshot, subscribeSession } from "@/lib/storage";
import { LENSES } from "@/lib/types";

function comparisonHeadline(gap: number): string {
  if (gap > 0) return "Your ideal role is closer to your Ikigai.";
  if (gap < 0) return "Your current role fits more of your priorities today.";
  return "Your current role and ideal role have the same Ikigai Fit.";
}

function ScoreBar({ value, tone }: { value: number; tone: "current" | "ideal" }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-mist" aria-hidden="true">
      <div
        className={`h-full rounded-full ${tone === "current" ? "bg-[#C5D2C4]" : "bg-forest"}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function ResultView() {
  const snapshot = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);

  if (snapshot.status === "pending") {
    return <div className="px-5 py-24 text-sm text-ink/60">Loading your comparison…</div>;
  }

  if (snapshot.status === "empty") {
    return (
      <MissingResult
        title="No comparison yet"
        body="Define your Ikigai and compare two roles to see the gap."
      />
    );
  }

  const { input, result } = snapshot.session;
  const gap = result.ideal.ikigaiFit - result.current.ikigaiFit;
  const gapLabel = signedDelta(result.current.ikigaiFit, result.ideal.ikigaiFit);
  const weights = input.ikigai.weights;

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
      {process.env.NODE_ENV === "development" ? (
        <p className="mb-8 inline-flex rounded-full border border-sage px-3 py-1 text-xs font-medium tracking-wide text-forest">
          {result.source === "mock" ? "Mock mode" : "Scored by JEV via AIHubMix"}
        </p>
      ) : null}

      <p className="text-[0.68rem] font-medium tracking-[0.28em] text-forest uppercase">
        Your career comparison
      </p>
      <h1 className="mt-4 max-w-xl font-serif text-4xl leading-[1.15] tracking-tight text-ink md:text-5xl">
        {comparisonHeadline(gap)}
      </h1>

      <div className="mt-12 grid items-stretch gap-4 md:mt-14 md:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)] md:gap-5">
        <article className="flex h-full flex-col items-center justify-center rounded-[20px] border border-sage bg-[#FBF8F2] px-6 py-8 text-center text-forest">
          <p className="text-[0.62rem] tracking-[0.28em] uppercase">Current role</p>
          <h2 className="mt-3 max-w-[16rem] text-balance font-serif text-[1.7rem] leading-tight tracking-tight text-ink">
            {input.currentRole.title}
          </h2>
          <p className="num mt-4 font-serif text-6xl leading-none">{result.current.ikigaiFit}</p>
        </article>

        <div className="flex items-center justify-center py-6 md:py-0">
          <div className="relative px-6 py-8 text-center text-forest">
            <span
              className="pointer-events-none absolute top-1/2 left-1/2 h-32 w-36 -translate-x-[62%] -translate-y-1/2 rounded-[50%]"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(186, 201, 186, 0.62) 0%, rgba(186, 201, 186, 0.22) 58%, rgba(186, 201, 186, 0) 76%)",
              }}
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute top-1/2 left-1/2 h-32 w-36 -translate-x-[28%] -translate-y-1/2 rounded-[50%]"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(176, 194, 208, 0.58) 0%, rgba(176, 194, 208, 0.2) 58%, rgba(176, 194, 208, 0) 76%)",
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-[0.62rem] tracking-[0.28em] uppercase">Ikigai gap</p>
              <p className="num mt-1 font-serif text-7xl leading-none">{gapLabel}</p>
              <p className="mt-1 text-[0.62rem] tracking-[0.32em] uppercase">Points</p>
            </div>
          </div>
        </div>

        <article className="flex h-full flex-col items-center justify-center rounded-[20px] border border-forest bg-forest px-6 py-8 text-center text-paper">
          <p className="text-[0.62rem] tracking-[0.28em] text-paper/75 uppercase">Ideal role</p>
          <h2 className="mt-3 max-w-[16rem] text-balance font-serif text-[1.7rem] leading-tight tracking-tight">
            {input.idealRole.title}
          </h2>
          <p className="num mt-4 font-serif text-6xl leading-none">{result.ideal.ikigaiFit}</p>
        </article>
      </div>

      <div className="mt-8 flex justify-center md:mt-10">
        <Link
          href="/share"
          className="inline-flex w-full max-w-md items-center justify-center gap-2.5 rounded-[18px] bg-forest px-8 py-4 text-base font-medium text-paper shadow-[0_12px_28px_rgba(36,75,62,0.22)] hover:bg-[#1d3e33] sm:w-auto sm:min-w-[280px]"
        >
          Create My Ikigai Card
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <section className="mt-16 md:mt-20" aria-labelledby="dimensions-heading">
        <h2
          id="dimensions-heading"
          className="text-[0.68rem] font-medium tracking-[0.28em] text-forest uppercase"
        >
          Why the roles fit differently
        </h2>
        <div className="mt-6">
          {LENSES.map((lens) => {
            const current = result.current[lens.key];
            const ideal = result.ideal[lens.key];
            return (
              <div key={lens.key} className="border-t border-mist py-5">
                <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
                  <span className="size-2 rounded-full" style={{ background: lens.color }} />
                  {lens.label}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-6 sm:gap-10">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-[0.62rem] tracking-[0.16em] text-ink/50 uppercase">Current</span>
                      <span className="num text-sm text-ink">{current}</span>
                    </div>
                    <div className="mt-2">
                      <ScoreBar value={current} tone="current" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-[0.62rem] tracking-[0.16em] text-ink/50 uppercase">Ideal</span>
                      <span className="num text-sm text-forest">{ideal}</span>
                    </div>
                    <div className="mt-2">
                      <ScoreBar value={ideal} tone="ideal" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mt-8 max-w-2xl text-xs leading-6 text-ink/50">
        Based on what matters most to you: Love {weights.love}% · Strength {weights.strength}% · World /
        Impact {weights.impact}% · Paid / Lifestyle {weights.paid}%
      </p>
    </div>
  );
}
