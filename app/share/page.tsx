import type { Metadata } from "next";
import { ShareStudio } from "@/components/share-studio";

export const metadata: Metadata = {
  title: "Ikigai card",
  description: "Turn your career alignment into a card you can save and share.",
};

export default function SharePage() {
  return <ShareStudio />;
}
