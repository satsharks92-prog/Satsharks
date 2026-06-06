import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Icon } from "../components/common/Icon";

export const Route = createFileRoute("/success-stories")({
  component: SuccessStories,
});

function SuccessStories() {
  const stories = [
    {
      name: "Sarah M.",
      score: "Scored 1580 (+210)",
      quote:
        "The personalized study plan was a game-changer. I felt completely prepared on test day and got into my dream school! The mentors really took the time to understand my weaknesses.",
      university: "Harvard University",
    },
    {
      name: "David L.",
      score: "Scored 1550 (+180)",
      quote:
        "The instructors genuinely care about your success. The practice materials perfectly mirrored the actual exam, making the real test feel like just another practice session.",
      university: "Stanford University",
    },
    {
      name: "Emily R.",
      score: "Scored 1590 (+150)",
      quote:
        "I struggled with the math section, but the targeted drills helped me achieve a perfect 800. Thank you SAT Sharks for giving me the confidence I needed.",
      university: "MIT",
    },
    {
      name: "Michael T.",
      score: "Scored 1540 (+230)",
      quote:
        "SAT Sharks transformed my approach to reading comprehension. The strategies taught were not just tips, but foundational skills that helped me tremendously.",
      university: "Yale University",
    },
    {
      name: "Jessica K.",
      score: "Scored 1560 (+190)",
      quote:
        "The essay review sessions were incredibly detailed. My advisor helped me craft a compelling narrative that stood out to admissions officers.",
      university: "Princeton University",
    },
    {
      name: "James B.",
      score: "Scored 1570 (+200)",
      quote:
        "From diagnostic to final test day, the support was unwavering. I couldn't have achieved this score without the structured timeline and rigorous practice.",
      university: "Columbia University",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-on-background animate-fade-up flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-surface-container-low py-20 md:py-28">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-primary">
                <Icon name="social_leaderboard" className="text-[16px]" /> Our Track Record
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold tracking-[-0.02em] md:text-5xl lg:text-6xl text-on-surface">
                Student <span className="text-primary">Success Stories</span>
              </h1>
              <p className="mt-6 text-lg text-on-surface-variant">
                Join hundreds of students who have achieved their target scores and gained admission to top-tier universities worldwide with SAT Sharks.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((item) => (
                <figure
                  key={item.name}
                  className="hover-lift relative rounded-2xl bg-surface-container-lowest p-8 shark-shadow border border-outline-variant/40 flex flex-col"
                >
                  <Icon
                    name="format_quote"
                    className="absolute -top-3 left-6 text-[44px] text-primary-fixed-dim"
                  />
                  <blockquote className="mt-4 text-on-surface leading-relaxed flex-1">
                    "{item.quote}"
                  </blockquote>
                  <figcaption className="mt-8 flex items-center gap-4 border-t border-outline-variant/30 pt-6">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-on-primary font-display text-lg font-bold">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-on-surface">{item.name}</div>
                      <div className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">
                        {item.score}
                      </div>
                      <div className="mt-0.5 text-xs text-on-surface-variant flex items-center gap-1">
                        <Icon name="school" className="text-[14px]" /> {item.university}
                      </div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
