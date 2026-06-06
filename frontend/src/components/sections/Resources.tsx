import { Icon } from "../common/Icon";

export function Resources() {
  const items = [
    {
      title: "Checklist of Supporting Documents for LUMS",
      views: 836,
      comments: 0,
      tag: "Admissions",
    },
    { title: "Admission Test Requirements for LUMS", views: 679, comments: 1, tag: "Requirements" },
    {
      title: "Don't Miss the Deadlines! Know the Important Dates",
      views: 359,
      comments: 1,
      tag: "Deadlines",
    },
  ];
  return (
    <section className="bg-surface-container-low py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">
              Resources
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.01em] md:text-4xl">
              SAT Prep Resources & FAQs
            </h2>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-primary hover:gap-2.5 transition-all"
          >
            Read More <Icon name="arrow_forward" className="text-[16px]" />
          </a>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <article
              key={it.title}
              className="hover-lift overflow-hidden rounded-2xl bg-surface-container-lowest shark-shadow border border-outline-variant/40"
            >
              <div className="relative h-44 bg-linear-to-br from-primary-fixed via-secondary-container to-primary-fixed-dim flex items-center justify-center">
                <Icon name="article" className="text-[64px] text-primary/40" />
                <span className="absolute top-4 left-4 rounded-full bg-surface-container-lowest/90 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-primary">
                  {it.tag}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-headline text-lg font-semibold leading-snug">{it.title}</h3>
                <div className="mt-5 flex items-center justify-between text-on-surface-variant">
                  <div className="flex items-center gap-4 font-mono text-[12px]">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="visibility" className="text-[16px]" /> {it.views}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="chat_bubble" className="text-[16px]" /> {it.comments}
                    </span>
                  </div>
                  <button
                    aria-label="Favorite"
                    className="text-on-surface-variant hover:text-error transition-colors"
                  >
                    <Icon name="favorite" className="text-[20px]" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
