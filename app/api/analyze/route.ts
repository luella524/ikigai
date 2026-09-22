import { NextResponse } from "next/server";
import { ConfigurationError, EvaluationError, runJevEvaluation } from "@/lib/aihubmix";
import { parseInput } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send your comparison as JSON." }, { status: 400 });
  }

  const parsed = parseInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, fields: parsed.fields }, { status: 400 });
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[ikigai] normalized roles sent to evaluation", {
      currentRole: parsed.value.currentRole,
      idealRole: parsed.value.idealRole,
    });
  }

  try {
    const result = await runJevEvaluation(parsed.value);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof EvaluationError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "The evaluation could not be completed. Try again in a moment." },
      { status: 500 },
    );
  }
}
