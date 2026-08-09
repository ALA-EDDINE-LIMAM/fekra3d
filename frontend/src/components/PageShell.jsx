export default function PageShell({ eyebrow, title, description, children }) {
  return (
    <section className="section-shell px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          {eyebrow ? <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{eyebrow}</div> : null}
          <h1 className="hero-title mt-3 text-3xl font-bold text-slate-900 dark:text-white md:text-5xl">{title}</h1>
          {description ? <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">{description}</p> : null}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
