import { Icon } from "../common/Icon";

export function Testimonials() {
  const t = [
    {
      name: "Sarah M.",
      score: "Scored 1580 (+210)",
      quote:
        "The personalized study plan was a game-changer. I felt completely prepared on test day and got into my dream school!",
    },
    {
      name: "David L.",
      score: "Scored 1550 (+180)",
      quote:
        "The instructors genuinely care about your success. The practice materials perfectly mirrored the actual exam.",
    },
    {
      name: "Emily R.",
      score: "Scored 1590 (+150)",
      quote:
        "I struggled with the math section, but the targeted drills helped me achieve a perfect 800. Thank you SAT Sharks!",
    },
  ];
  return (
    <section id="testimonials" className="bg-surface-container-low py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">
            Results
          </span>
          <h2
            id="results"
            className="mt-3 font-display text-3xl font-bold tracking-[-0.01em] md:text-4xl"
          >
            Student Success Stories
          </h2>
          <p className="mt-4 text-on-surface-variant">
            Hear directly from our students who achieved their dream scores and secured spots at top
            universities.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.map((item) => (
            <figure
              key={item.name}
              className="hover-lift relative rounded-2xl bg-surface-container-lowest p-8 shark-shadow border border-outline-variant/40"
            >
              <Icon
                name="format_quote"
                className="absolute -top-3 left-6 text-[44px] text-primary-fixed-dim"
              />
              <blockquote className="mt-2 text-on-surface leading-relaxed">
                "{item.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-on-primary font-display font-bold">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-on-surface">{item.name}</div>
                  <div className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">
                    {item.score}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
