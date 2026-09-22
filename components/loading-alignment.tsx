const ORBITS = [
  { color: "#E97A5F", dx: "-18px", dy: "-16px" },
  { color: "#A7B9A7", dx: "18px", dy: "-16px" },
  { color: "#7B9DB8", dx: "-18px", dy: "16px" },
  { color: "#D7AB4C", dx: "18px", dy: "16px" },
];

export function LoadingAlignment() {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-paper/90 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center">
        <div className="relative h-28 w-28">
          {ORBITS.map((orbit) => (
            <span
              key={orbit.color}
              className="ikigai-orbit absolute h-14 w-14 rounded-full"
              style={{
                top: "50%",
                left: "50%",
                marginTop: -28,
                marginLeft: -28,
                background: orbit.color,
                opacity: 0.55,
                ["--dx" as string]: orbit.dx,
                ["--dy" as string]: orbit.dy,
              }}
            />
          ))}
        </div>
        <p className="mt-8 font-serif text-3xl tracking-tight text-ink">Finding your Ikigai gap…</p>
      </div>
    </div>
  );
}
