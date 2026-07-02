// Branded route-transition loading screen.
export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground micro-noise">
      <div className="flex flex-col items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-lg font-semibold text-gold-100 shadow-gold motion-safe:animate-pulse">
          O
        </span>
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">OTIZ CAPITAL</span>
      </div>
    </main>
  );
}
