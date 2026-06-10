import { motion } from "framer-motion";
import { Icon } from "../common/Icon";

export function Testimonials() {
  const testimonials = [
    {
      name: "Sarah M.",
      score: "Scored 1580 (+210)",
      destination: "Stanford University '28",
      quote:
        "The personalized study plan was a complete game-changer. I felt confident, focused, and fully prepared on test day. Getting into my dream school still feels surreal!",
    },
    {
      name: "David L.",
      score: "Scored 1550 (+180)",
      destination: "Princeton University '29",
      quote:
        "The mentors genuinely care about your success. The study material and timed drills perfectly mirrored the actual exam environment, removing all test-day anxiety.",
    },
    {
      name: "Emily R.",
      score: "Scored 1590 (+150)",
      destination: "Yale University '28",
      quote:
        "I was struggling to break 700 in the Math section, but the targeted problem walkthroughs helped me achieve a perfect 800. I couldn't have done it without SAT Sharks!",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section id="testimonials" className="bg-surface-container-low py-24 md:py-36 relative overflow-hidden border-t border-b border-outline-variant/60">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
            Proven Results
          </span>
          <h2
            id="results"
            className="font-display text-4xl font-extrabold tracking-tight md:text-5xl text-primary"
          >
            Student Success Stories
          </h2>
          <div className="h-[1px] w-16 bg-accent mx-auto my-2" />
          <p className="text-on-surface-variant font-body font-light text-base md:text-lg leading-relaxed">
            Real stories of score transformations and letters of acceptance from top-tier universities.
          </p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-20 grid gap-8 md:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.figure
              key={t.name}
              variants={item}
              whileHover={{ y: -6 }}
              className="relative rounded-xl bg-surface p-8 md:p-10 shark-shadow border border-outline-variant/40 flex flex-col justify-between"
            >
              {/* Gold Quote Icon */}
              <div className="text-accent/20 absolute -top-5 left-8">
                <span className="font-display text-[80px] leading-none select-none">“</span>
              </div>

              <blockquote className="relative mt-4 font-headline italic text-lg leading-relaxed text-on-surface font-light">
                "{t.quote}"
              </blockquote>

              <figcaption className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-accent font-display text-[16px] font-bold border border-accent/30">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-body text-sm font-bold text-primary">{t.name}</div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="font-body text-[11px] font-bold uppercase tracking-[0.05em] text-accent">
                      {t.score}
                    </span>
                    <span className="hidden sm:inline text-outline-variant text-[11px]">•</span>
                    <span className="font-body text-[11px] font-medium text-on-surface-variant">
                      {t.destination}
                    </span>
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
