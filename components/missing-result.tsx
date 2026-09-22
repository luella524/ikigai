import Link from "next/link";
import { IkigaiMark } from "@/components/ikigai-mark";

export function MissingResult({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
      <IkigaiMark size={112} />
      <h1 className="mt-8 font-serif text-4xl tracking-tight text-ink">{title}</h1>
      <p className="mt-4 text-base leading-7 text-ink/75">{body}</p>
      <Link
        href="/compare"
        className="mt-8 rounded-[18px] bg-forest px-5 py-3 text-sm font-medium text-paper hover:bg-[#1d3e33]"
      >
        Compare My Jobs
      </Link>
    </section>
  );
}
