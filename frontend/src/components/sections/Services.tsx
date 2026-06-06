import { Icon } from "../common/Icon";

export function Services() {
  const services = [
    {
      icon: "menu_book",
      title: "SAT Preparation",
      desc: "Master every section with our proprietary curriculum, targeted practice, and expert guidance.",
    },
    {
      icon: "account_balance",
      title: "College Counseling",
      desc: "Strategic advice on college selection, application positioning, and interview preparation.",
    },
    {
      icon: "edit_note",
      title: "Essay Review",
      desc: "Craft compelling personal statements and supplemental essays that stand out to admissions officers.",
    },
    {
      icon: "monitoring",
      title: "Progress Tracking",
      desc: "Detailed analytics and regular assessments to identify weak points and optimize study time.",
    },
  ];
  return (
    <section id="services" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">
            Our Services
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.01em] md:text-4xl">
            Premium Educational Services
          </h2>
          <p className="mt-4 text-on-surface-variant">
            Comprehensive support tailored to your unique academic journey and college aspirations.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <article
              key={s.title}
              className="hover-lift group rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-7 shark-shadow"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                <Icon name={s.icon} className="text-[26px]" />
              </div>
              <h3 className="mt-5 font-headline text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{s.desc}</p>
              <a
                href="#booking"
                className="mt-5 inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-primary group-hover:gap-2.5 transition-all"
              >
                Learn More <Icon name="arrow_forward" className="text-[16px]" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
