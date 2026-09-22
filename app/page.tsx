import Link from "next/link";
import { IkigaiMark } from "@/components/ikigai-mark";

const STEPS = [
  {
    title: "Define your Ikigai",
    body: "Tell us what matters most in your next chapter, and how much each dimension should count.",
  },
  {
    title: "Compare two roles",
    body: "Put your current role beside the role you want.",
  },
  {
    title: "See your Ikigai Gap",
    body: "Read the gap, then save a card with your name and both scores.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 md:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] md:py-24">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-forest uppercase">
            Career alignment
          </p>
          <h1 className="mt-5 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight text-ink md:text-7xl">
            How close are you to your dream career?
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-ink/80">
            Compare your current role with the role you want and see the gap between where you are
            and where you want to go.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href="/compare"
              className="rounded-[18px] bg-forest px-5 py-3 text-sm font-medium text-paper hover:bg-[#1d3e33]"
            >
              Compare My Jobs
            </Link>
            <p className="text-sm text-ink/70">Free · Takes about 5 minutes</p>
          </div>
        </div>

        <img
          src="/hero-career-card.jpg"
          alt="Example career card for Ella Lu. Current role Digital Marketing, 45. Ikigai gap plus 10 points. Ideal role AI Partnerships, 55."
          className="mx-auto w-full max-w-[540px]"
        />
      </section>

      <section className="border-t border-mist">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
          <h2 className="font-serif text-4xl tracking-tight md:text-5xl">What is Ikigai?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink/80">
            Ikigai is a Japanese idea about finding meaning and direction in life. Here it is where
            what you love, what you are good at, what the world needs, what you can get paid for.
          </p>
          <img
            src="/ikigai-diagram.png"
            alt="Ikigai diagram showing what you love, what you are good at, what the world needs, and what you can be paid for"
            className="mx-auto mt-10 w-full max-w-2xl"
          />
        </div>
      </section>

      <section id="how-it-works" className="border-t border-mist">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <h2 className="font-serif text-4xl tracking-tight md:text-5xl">How it works</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <p className="num font-serif text-4xl text-forest">0{index + 1}</p>
                <h3 className="mt-4 font-serif text-2xl tracking-tight">{step.title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-7 text-ink/75">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[24px] border border-mist px-6 py-14 md:px-12">
          <IkigaiMark
            size={280}
            className="pointer-events-none absolute -right-16 -bottom-20 opacity-60"
          />
          <div className="relative max-w-xl">
            <h2 className="font-serif text-4xl tracking-tight md:text-5xl">
              Build a career around what matters most to you.
            </h2>
            <p className="mt-4 text-lg leading-8 text-ink/80">Ready to embrace your ikigai?</p>
            <Link
              href="/compare"
              className="mt-8 inline-flex rounded-[18px] bg-forest px-5 py-3 text-sm font-medium text-paper hover:bg-[#1d3e33]"
            >
              Compare My Jobs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
