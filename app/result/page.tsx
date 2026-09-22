import type { Metadata } from "next";
import { ResultView } from "@/components/result-view";

export const metadata: Metadata = {
  title: "Your Ikigai gap",
  description: "The gap between your current role and the role you want.",
};

export default function ResultPage() {
  return <ResultView />;
}
