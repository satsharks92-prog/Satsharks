import { Icon } from "../common/Icon";

export function CTA() {
  return (
    <section
      id="contact"
      className="bg-primary text-on-primary py-24 md:py-32 relative overflow-hidden"
    >
      <div aria-hidden className="absolute inset-0 opacity-30">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary-fixed/40 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-secondary-container/30 blur-3xl" />
      </div>
      <div className="relative mx-auto grid max-w-[1200px] gap-12 px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] md:text-5xl">
            Your Dream University Starts Here
          </h2>
          <p className="mt-5 max-w-md text-on-primary/85 text-lg">
            Don't leave your future to chance. Partner with SAT Sharks and gain the competitive edge
            you need to stand out.
          </p>
          <div className="mt-10 space-y-4 text-sm">
            <a
              href="mailto:hello@satsharks.com"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <Icon name="mail" />
              </span>
              hello@satsharks.com
            </a>
            <a
              href="tel:+18005550199"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <Icon name="call" />
              </span>
              +1 (800) 555-0199
            </a>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <Icon name="location_on" />
              </span>
              123 Education Lane, Boston, MA
            </div>
          </div>
          <div className="mt-10 flex items-center gap-3">
            {["share", "thumb_up", "favorite"].map((i) => (
              <button
                key={i}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
              >
                <Icon name={i} className="text-[18px]" />
              </button>
            ))}
          </div>
        </div>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="rounded-2xl bg-surface-container-lowest text-on-surface p-8 shark-shadow"
        >
          <h3 className="font-headline text-2xl font-semibold">Send us a message</h3>
          <div className="mt-6 space-y-4">
            <div>
              <label className="font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                Message
              </label>
              <textarea
                rows={4}
                placeholder="Tell us about your goals..."
                className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <button
              type="submit"
              className="btn-shimmer mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-on-primary hover:bg-primary-container transition-colors"
            >
              Submit Inquiry <Icon name="send" className="text-[18px]" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
