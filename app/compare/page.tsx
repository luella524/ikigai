import type { Metadata } from "next";
import { CompareFlow } from "@/components/compare-flow";

export const metadata: Metadata = {
  title: "Compare",
  description: "Define what matters, then compare your current role with the role you want.",
};

export default function ComparePage() {
  return <CompareFlow />;
}
