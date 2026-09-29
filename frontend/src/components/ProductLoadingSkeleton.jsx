export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/40 dark:border-white/10 bg-slate-100/40 dark:bg-white/5">
      <div className="aspect-[4/3] w-full bg-slate-200/70 dark:bg-slate-800/70" aria-hidden="true" />
      <div className="flex flex-col gap-3 p-3">
        <div className="h-4 w-4/5 rounded bg-slate-200/80 dark:bg-slate-800" aria-hidden="true" />
        <div className="h-3 w-2/5 rounded bg-slate-200/80 dark:bg-slate-800" aria-hidden="true" />
      </div>
    </div>
  );
}

export function ProductHeroSkeleton() {
  return (
    <div className="w-[220px] md:w-[240px] rounded-2xl border border-slate-200/40 dark:border-white/10 bg-slate-100/50 dark:bg-slate-950/60 p-3 shadow-2xl">
      <div className="aspect-[4/3] w-full rounded-xl bg-slate-200/70 dark:bg-slate-800/70" aria-hidden="true" />
      <div className="mt-3 h-3 w-1/3 rounded bg-slate-200/80 dark:bg-slate-800" aria-hidden="true" />
      <div className="mt-2 h-4 w-4/5 rounded bg-slate-200/80 dark:bg-slate-800" aria-hidden="true" />
      <div className="mt-3 h-3 w-2/5 rounded bg-slate-200/80 dark:bg-slate-800" aria-hidden="true" />
    </div>
  );
}
