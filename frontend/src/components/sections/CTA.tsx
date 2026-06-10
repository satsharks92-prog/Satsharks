import { motion } from "framer-motion";
import { Icon } from "../common/Icon";

export function CTA() {
  return (
    <section
      id="contact"
      className="bg-primary text-on-primary py-24 md:py-36 relative overflow-hidden border-t border-accent/20"
    >
      {/* Visual lighting background effects */}
      <div aria-hidden className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-32 left-1/4 h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[30rem] w-[30rem] rounded-full bg-secondary-container/15 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-[1200px] gap-16 px-6 lg:grid-cols-12 z-10 items-center">
        {/* Left column: Contact / Trust */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 space-y-8"
        >
          <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
            Inquiries
          </span>
          <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl leading-tight text-on-primary">
            Your Premium Admissions Journey Starts Here
          </h2>
          <p className="max-w-md font-body text-base font-light text-on-primary/80 leading-relaxed">
            Do not leave your academic future to chance. Connect with our advisory board and gain the structural support required to excel.
          </p>

          <div className="space-y-5 pt-4">
            <a
              href="mailto:hello@satsharks.com"
              className="flex items-center gap-4 group hover:text-accent transition-colors"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 border border-white/10 group-hover:border-accent/40 transition-colors">
                <Icon name="mail" className="text-accent text-[20px]" />
              </span>
              <span className="font-body text-sm font-semibold">hello@satsharks.com</span>
            </a>
            <a
              href="tel:+18005550199"
              className="flex items-center gap-4 group hover:text-accent transition-colors"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 border border-white/10 group-hover:border-accent/40 transition-colors">
                <Icon name="call" className="text-accent text-[20px]" />
              </span>
              <span className="font-body text-sm font-semibold">+1 (800) 555-0199</span>
            </a>
            <div className="flex items-center gap-4 group">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 border border-white/10 pointer-events-none">
                <Icon name="location_on" className="text-accent text-[20px]" />
              </span>
              <span className="font-body text-sm font-semibold">123 Education Lane, Boston, MA</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6">
            {["share", "thumb_up", "favorite"].map((i) => (
              <motion.button
                key={i}
                whileHover={{ y: -3 }}
                className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 border border-white/10 hover:border-accent/40 text-on-primary hover:text-accent transition-colors cursor-pointer"
              >
                <Icon name={i} className="text-[18px]" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Right column: Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6"
        >
          <form
            onSubmit={(e) => e.preventDefault()}
            className="rounded-xl border border-accent/20 bg-surface text-on-surface p-8 md:p-10 shark-shadow"
          >
            <h3 className="font-display text-3xl font-bold text-primary">
              Send us a message
            </h3>
            <p className="font-body text-xs font-light text-on-surface-variant/80 mt-1">
              Complete the fields below to initiate your consultation ticket.
            </p>
            
            <div className="mt-8 space-y-6">
              <div>
                <label className="block font-body text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 transition-all font-body font-light"
                />
              </div>
              
              <div>
                <label className="block font-body text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 transition-all font-body font-light"
                />
              </div>
              
              <div>
                <label className="block font-body text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Message Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your educational background and target universities..."
                  className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 transition-all font-body font-light resize-none"
                />
              </div>

              <button
                type="submit"
                className="btn-shimmer mt-2 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-6 py-4 text-xs font-bold uppercase tracking-[0.1em] text-on-primary shark-shadow hover:bg-accent transition-all duration-300 cursor-pointer"
              >
                Submit Inquiry <Icon name="send" className="text-[16px]" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
