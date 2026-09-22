import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-mist/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-3.5">
        <Link href="/" className="font-serif text-[1.7rem] leading-none tracking-tight text-ink">
          ikigai
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6" aria-label="Primary">
          <Link href="/#how-it-works" className="text-sm text-ink/75 hover:text-ink">
            How it works
          </Link>
          <Link
            href="/compare"
            className="rounded-[18px] bg-forest px-3.5 py-2 text-sm font-medium text-paper hover:bg-[#1d3e33] sm:px-4"
          >
            Compare My Jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}
