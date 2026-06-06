import { Icon } from "../common/Icon";

export function Process() {
  const steps = [
    {
      icon: "query_stats",
      t: "Diagnostic",
      d: "Comprehensive initial assessment to identify your baseline score and areas for growth.",
    },
    {
      icon: "route",
      t: "Study Plan",
      d: "A custom-tailored roadmap targeting your weaknesses and reinforcing your strengths.",
    },
    {
      icon: "fitness_center",
      t: "Practice",
      d: "Rigorous drills, timed practice tests, and one-on-one expert mentoring sessions.",
    },
    {
      icon: "workspace_premium",
      t: "Admissions",
      d: "Ongoing support through final test day and into your college application process.",
    },
  ];
  return (
    <section id="timeline" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">
            Timeline
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.01em] md:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-on-surface-variant">
            A proven four-step methodology designed to maximize your potential and ensure success.
          </p>
        </div>
        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.t}
              className="relative rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-7 shark-shadow"
            >
              <div className="absolute -top-4 left-7 inline-flex h-8 items-center rounded-full bg-primary px-3 font-mono text-[12px] font-bold tracking-[0.08em] text-on-primary">
                STEP 0{i + 1}
              </div>
              <div className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-primary">
                <Icon name={s.icon} className="text-[26px]" />
              </div>
              <h3 className="mt-5 font-headline text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
