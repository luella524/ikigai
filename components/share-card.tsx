import type { CSSProperties, Ref } from "react";
import { CARD_DOMAIN, CARD_HEIGHT, CARD_WIDTH } from "@/lib/types";
import { signedDelta } from "@/lib/caption";

type ShareCardProps = {
  cardRef?: Ref<HTMLElement>;
  name: string;
  currentTitle: string;
  idealTitle: string;
  currentScore: number;
  idealScore: number;
};

const FOREST = "#244B3E";
const SERIF = "var(--font-fraunces), Georgia, serif";
const SANS = "var(--font-dm-sans), Helvetica, sans-serif";

function wash(color: string): CSSProperties {
  return {
    position: "absolute",
    borderRadius: "50%",
    background: `radial-gradient(circle, ${color} 0%, transparent 72%)`,
  };
}

function Rule() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        margin: "14px 0",
      }}
    >
      <span style={{ width: 78, height: 1, background: FOREST, opacity: 0.4 }} />
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          border: `1.5px solid ${FOREST}`,
          opacity: 0.55,
        }}
      />
      <span style={{ width: 78, height: 1, background: FOREST, opacity: 0.4 }} />
    </div>
  );
}

function Label({ children, marginTop = 0 }: { children: string; marginTop?: number }) {
  return (
    <p
      style={{
        margin: `${marginTop}px 0 0`,
        fontSize: 16,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: FOREST,
      }}
    >
      {children}
    </p>
  );
}

export function ShareCard({
  cardRef,
  name,
  currentTitle,
  idealTitle,
  currentScore,
  idealScore,
}: ShareCardProps) {
  const deltaLabel = signedDelta(currentScore, idealScore);

  return (
    <article
      ref={cardRef}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: "relative",
        overflow: "hidden",
        background: "#F3EEE4",
        color: FOREST,
        fontFamily: SANS,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          ...wash("rgba(206, 156, 140, 0.62)"),
          width: 680,
          height: 680,
          left: -180,
          top: -90,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          ...wash("rgba(147, 166, 148, 0.58)"),
          width: 740,
          height: 740,
          left: -220,
          bottom: -180,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          ...wash("rgba(148, 170, 188, 0.55)"),
          width: 640,
          height: 640,
          right: -160,
          bottom: -80,
        }}
      />

      <svg
        aria-hidden="true"
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <circle
          cx="900"
          cy="340"
          r="280"
          fill="none"
          stroke="#C4A46A"
          strokeWidth="2"
          strokeDasharray="460 1400"
          strokeLinecap="round"
        />
        <circle cx="1040" cy="150" r="7" fill="#C4A46A" />
        <circle
          cx="200"
          cy="1080"
          r="250"
          fill="none"
          stroke="#C4A46A"
          strokeWidth="2"
          strokeDasharray="400 1300"
          strokeLinecap="round"
        />
        <circle cx="90" cy="1240" r="6" fill="#C4A46A" />
      </svg>

      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 600,
            background: "#FBF8F2",
            border: `2px solid ${FOREST}`,
            borderRadius: 28,
            padding: 8,
          }}
        >
          <div
            style={{
              border: `1.5px solid ${FOREST}`,
              borderRadius: 22,
              padding: "40px 40px 28px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontSize: 48,
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              ikigai
            </p>
            <div
              aria-hidden="true"
              style={{
                width: "72%",
                height: 1,
                margin: "14px auto 0",
                background: FOREST,
                opacity: 0.4,
              }}
            />
            <Label marginTop={12}>Career alignment</Label>
            <p
              style={{
                margin: "16px 0 0",
                fontFamily: SERIF,
                fontSize: 52,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              {name}
            </p>

            <Label marginTop={26}>Current role</Label>
            <p
              style={{
                margin: "8px 0 0",
                fontFamily: SERIF,
                fontSize: 34,
                lineHeight: 1.15,
              }}
            >
              {currentTitle}
            </p>
            <p
              style={{
                margin: "8px 0 0",
                fontFamily: SERIF,
                fontSize: 76,
                lineHeight: 0.95,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {currentScore}
            </p>

            <Rule />

            <Label>Ikigai gap</Label>
            <p
              style={{
                margin: "8px 0 0",
                fontFamily: SERIF,
                fontSize: 68,
                lineHeight: 0.95,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {deltaLabel}
            </p>
            <Label marginTop={8}>Points</Label>

            <Rule />

            <Label>Ideal role</Label>
            <p
              style={{
                margin: "10px 0 0",
                fontFamily: SERIF,
                fontSize: 34,
                lineHeight: 1.15,
              }}
            >
              {idealTitle}
            </p>
            <p
              style={{
                margin: "8px 0 0",
                fontFamily: SERIF,
                fontSize: 76,
                lineHeight: 0.95,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {idealScore}
            </p>
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 18,
                letterSpacing: "0.08em",
                color: FOREST,
                opacity: 0.75,
              }}
            >
              {CARD_DOMAIN}
            </p>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 10.5,
                letterSpacing: "0.22em",
                color: "#A7B9A7",
              }}
            >
              SCORING BY JEV · VIA AIHUBMIX
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
