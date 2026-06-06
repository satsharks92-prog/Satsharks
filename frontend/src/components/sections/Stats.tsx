export function Stats() {
  const stats = [
    { v: "98%", l: "Satisfaction" },
    { v: "1500+", l: "Mentored" },
    { v: "250+", l: "Admissions" },
    { v: "200+", l: "Score Improvement" },
  ];
  return (
    <section className="relative -mt-10">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="glass-card shark-shadow grid grid-cols-2 gap-6 rounded-2xl px-6 py-8 md:grid-cols-4 md:px-10">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-3xl font-extrabold tracking-[-0.02em] text-primary md:text-4xl">
                {s.v}
              </div>
              <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
