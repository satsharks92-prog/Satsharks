import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import logoAsset from "@/assets/logo.png.asset.json";
import heroAsset from "@/assets/hero.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SAT Sharks — Achieve Your Dream SAT Score & College Admission" },
      { name: "description", content: "Personalized SAT preparation, expert college counseling, essay reviews, and proven strategies." },
      { property: "og:title", content: "SAT Sharks — Achieve Your Dream SAT Score" },
      { property: "og:description", content: "Personalized SAT prep, college counseling, and essay reviews." },
      { property: "og:image", content: heroAsset.url },
      { property: "twitter:image", content: heroAsset.url },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

function Landing() {
  return (
    <div className="min-h-screen bg-background text-on-background overflow-x-hidden">
      <Header />
      <Hero />
      <Stats />
      <Services />
      <Testimonials />
      <Process />
      <Resources />
      <Booking />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------------- Header ---------------- */
function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#services", label: "Services" },
    { href: "#results", label: "Results" },
    { href: "#timeline", label: "Timeline" },
    { href: "#testimonials", label: "Testimonials" },
  ];
  return (
    <header className="sticky top-0 z-50 glass-card border-b border-outline-variant/40">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
        <a href="#top" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="SAT Sharks" className="h-10 w-auto" />
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map(l => (
            <a key={l.href} href={l.href} className="font-mono text-[13px] uppercase tracking-[0.08em] text-on-surface-variant hover:text-primary transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <a href="#booking" className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shark-shadow hover:bg-primary-container transition-colors">
            Register
            <Icon name="arrow_forward" className="text-[18px]" />
          </a>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden rounded-lg p-2 text-on-surface" aria-label="menu">
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-outline-variant/40 bg-surface-container-lowest px-6 py-4 space-y-3">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block font-mono text-[13px] uppercase tracking-[0.08em] text-on-surface-variant">{l.label}</a>
          ))}
          <a href="#booking" onClick={() => setOpen(false)} className="block w-full rounded-xl bg-primary px-5 py-2.5 text-center text-sm font-semibold text-on-primary">Register</a>
        </div>
      )}
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section id="top" className="relative pt-12 pb-24 md:pt-20 md:pb-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary-fixed/60 blur-3xl" />
        <div className="absolute top-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-secondary-container/50 blur-3xl" />
      </div>
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-primary">
            <Icon name="verified" className="text-[16px]" />
            Trusted by Students Worldwide
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-on-surface md:text-5xl lg:text-6xl">
            Achieve Your Dream <span className="text-primary">SAT Score</span> & College Admission
          </h1>
          <p className="mt-6 max-w-xl text-lg text-on-surface-variant">
            Personalized SAT preparation, expert college counseling, essay reviews, and proven strategies designed to give you the competitive edge in high-stakes testing.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#booking" className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-on-primary shark-shadow hover:bg-primary-container transition-colors">
              Book Class <Icon name="arrow_forward" className="text-[18px]" />
            </a>
            <a href="#services" className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-3.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors">
              <Icon name="play_circle" className="text-[18px]" /> Free Trial
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Icon name="trending_up" className="text-primary" />
              <span className="font-medium text-on-surface">Top 1% Scorer</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Icon name="school" className="text-primary" />
              <span className="font-medium text-on-surface">Ivy League Prep</span>
            </div>
          </div>
        </div>
        <div className="relative animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="relative">
            <div className="absolute -inset-6 rounded-2xl bg-linear-to-br from-primary-fixed/60 via-transparent to-secondary-container/50 blur-2xl -z-10" />
            <img src={heroAsset.url} alt="SAT Sharks platform illustration" className="animate-float w-full rounded-2xl shark-shadow" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Stats ---------------- */
function Stats() {
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
          {stats.map(s => (
            <div key={s.l} className="text-center">
              <div className="font-display text-3xl font-extrabold tracking-[-0.02em] text-primary md:text-4xl">{s.v}</div>
              <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Services ---------------- */
function Services() {
  const services = [
    { icon: "menu_book", title: "SAT Preparation", desc: "Master every section with our proprietary curriculum, targeted practice, and expert guidance." },
    { icon: "account_balance", title: "College Counseling", desc: "Strategic advice on college selection, application positioning, and interview preparation." },
    { icon: "edit_note", title: "Essay Review", desc: "Craft compelling personal statements and supplemental essays that stand out to admissions officers." },
    { icon: "monitoring", title: "Progress Tracking", desc: "Detailed analytics and regular assessments to identify weak points and optimize study time." },
  ];
  return (
    <section id="services" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">Our Services</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.01em] md:text-4xl">Premium Educational Services</h2>
          <p className="mt-4 text-on-surface-variant">Comprehensive support tailored to your unique academic journey and college aspirations.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(s => (
            <article key={s.title} className="hover-lift group rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-7 shark-shadow">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                <Icon name={s.icon} className="text-[26px]" />
              </div>
              <h3 className="mt-5 font-headline text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{s.desc}</p>
              <a href="#booking" className="mt-5 inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-primary group-hover:gap-2.5 transition-all">
                Learn More <Icon name="arrow_forward" className="text-[16px]" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
function Testimonials() {
  const t = [
    { name: "Sarah M.", score: "Scored 1580 (+210)", quote: "The personalized study plan was a game-changer. I felt completely prepared on test day and got into my dream school!" },
    { name: "David L.", score: "Scored 1550 (+180)", quote: "The instructors genuinely care about your success. The practice materials perfectly mirrored the actual exam." },
    { name: "Emily R.", score: "Scored 1590 (+150)", quote: "I struggled with the math section, but the targeted drills helped me achieve a perfect 800. Thank you SAT Sharks!" },
  ];
  return (
    <section id="testimonials" className="bg-surface-container-low py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">Results</span>
          <h2 id="results" className="mt-3 font-display text-3xl font-bold tracking-[-0.01em] md:text-4xl">Student Success Stories</h2>
          <p className="mt-4 text-on-surface-variant">Hear directly from our students who achieved their dream scores and secured spots at top universities.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.map(item => (
            <figure key={item.name} className="hover-lift relative rounded-2xl bg-surface-container-lowest p-8 shark-shadow border border-outline-variant/40">
              <Icon name="format_quote" className="absolute -top-3 left-6 text-[44px] text-primary-fixed-dim" />
              <blockquote className="mt-2 text-on-surface leading-relaxed">"{item.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-on-primary font-display font-bold">{item.name.charAt(0)}</div>
                <div>
                  <div className="font-semibold text-on-surface">{item.name}</div>
                  <div className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">{item.score}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Process ---------------- */
function Process() {
  const steps = [
    { icon: "query_stats", t: "Diagnostic", d: "Comprehensive initial assessment to identify your baseline score and areas for growth." },
    { icon: "route", t: "Study Plan", d: "A custom-tailored roadmap targeting your weaknesses and reinforcing your strengths." },
    { icon: "fitness_center", t: "Practice", d: "Rigorous drills, timed practice tests, and one-on-one expert mentoring sessions." },
    { icon: "workspace_premium", t: "Admissions", d: "Ongoing support through final test day and into your college application process." },
  ];
  return (
    <section id="timeline" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">Timeline</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.01em] md:text-4xl">How It Works</h2>
          <p className="mt-4 text-on-surface-variant">A proven four-step methodology designed to maximize your potential and ensure success.</p>
        </div>
        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="relative rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-7 shark-shadow">
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

/* ---------------- Resources ---------------- */
function Resources() {
  const items = [
    { title: "Checklist of Supporting Documents for LUMS", views: 836, comments: 0, tag: "Admissions" },
    { title: "Admission Test Requirements for LUMS", views: 679, comments: 1, tag: "Requirements" },
    { title: "Don't Miss the Deadlines! Know the Important Dates", views: 359, comments: 1, tag: "Deadlines" },
  ];
  return (
    <section className="bg-surface-container-low py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">Resources</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.01em] md:text-4xl">SAT Prep Resources & FAQs</h2>
          </div>
          <a href="#" className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-primary hover:gap-2.5 transition-all">
            Read More <Icon name="arrow_forward" className="text-[16px]" />
          </a>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map(it => (
            <article key={it.title} className="hover-lift overflow-hidden rounded-2xl bg-surface-container-lowest shark-shadow border border-outline-variant/40">
              <div className="relative h-44 bg-linear-to-br from-primary-fixed via-secondary-container to-primary-fixed-dim flex items-center justify-center">
                <Icon name="article" className="text-[64px] text-primary/40" />
                <span className="absolute top-4 left-4 rounded-full bg-surface-container-lowest/90 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-primary">{it.tag}</span>
              </div>
              <div className="p-6">
                <h3 className="font-headline text-lg font-semibold leading-snug">{it.title}</h3>
                <div className="mt-5 flex items-center justify-between text-on-surface-variant">
                  <div className="flex items-center gap-4 font-mono text-[12px]">
                    <span className="inline-flex items-center gap-1"><Icon name="visibility" className="text-[16px]" /> {it.views}</span>
                    <span className="inline-flex items-center gap-1"><Icon name="chat_bubble" className="text-[16px]" /> {it.comments}</span>
                  </div>
                  <button aria-label="Favorite" className="text-on-surface-variant hover:text-error transition-colors">
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

/* ---------------- Booking ---------------- */
function Booking() {
  return (
    <section id="booking" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="rounded-2xl bg-inverse-surface text-inverse-on-surface p-8 md:p-14 shark-shadow relative overflow-hidden">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary-fixed-dim">Booking</span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.01em] md:text-4xl">Schedule Your Session Now</h2>
              <p className="mt-4 text-inverse-on-surface/80">Book a consultation with an expert advisor to discuss your goals and how we can help you achieve them.</p>
              <a href="#contact" className="btn-shimmer mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-on-primary hover:bg-primary-container transition-colors">
                <Icon name="calendar_month" className="text-[18px]" /> Book Consultation
              </a>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
              <div className="flex items-center gap-3 text-primary-fixed-dim">
                <Icon name="calendar_month" className="text-[28px]" />
                <span className="font-mono text-[12px] uppercase tracking-[0.08em]">Calendly Widget</span>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-1.5">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div key={i} className={`aspect-square rounded-lg text-center text-xs leading-[1] flex items-center justify-center font-mono ${[3,8,15,22].includes(i) ? "bg-primary text-on-primary font-bold" : "bg-white/5 text-inverse-on-surface/60"}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-inverse-on-surface/60 font-mono">Available slots highlighted</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA + Contact ---------------- */
function CTA() {
  return (
    <section id="contact" className="bg-primary text-on-primary py-24 md:py-32 relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 opacity-30">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary-fixed/40 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-secondary-container/30 blur-3xl" />
      </div>
      <div className="relative mx-auto grid max-w-[1200px] gap-12 px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] md:text-5xl">Your Dream University Starts Here</h2>
          <p className="mt-5 max-w-md text-on-primary/85 text-lg">Don't leave your future to chance. Partner with SAT Sharks and gain the competitive edge you need to stand out.</p>
          <div className="mt-10 space-y-4 text-sm">
            <a href="mailto:hello@satsharks.com" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Icon name="mail" /></span>
              hello@satsharks.com
            </a>
            <a href="tel:+18005550199" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Icon name="call" /></span>
              +1 (800) 555-0199
            </a>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Icon name="location_on" /></span>
              123 Education Lane, Boston, MA
            </div>
          </div>
          <div className="mt-10 flex items-center gap-3">
            {["share", "thumb_up", "favorite"].map(i => (
              <button key={i} className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 hover:bg-white/25 transition-colors">
                <Icon name={i} className="text-[18px]" />
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="rounded-2xl bg-surface-container-lowest text-on-surface p-8 shark-shadow">
          <h3 className="font-headline text-2xl font-semibold">Send us a message</h3>
          <div className="mt-6 space-y-4">
            <div>
              <label className="font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">Full Name</label>
              <input type="text" placeholder="Jane Doe" className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">Email Address</label>
              <input type="email" placeholder="you@example.com" className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">Message</label>
              <textarea rows={4} placeholder="Tell us about your goals..." className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <button type="submit" className="btn-shimmer mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-on-primary hover:bg-primary-container transition-colors">
              Submit Inquiry <Icon name="send" className="text-[18px]" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  const links = ["Privacy Policy", "Terms of Service", "FAQ", "Careers", "Contact Us"];
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <div className="flex items-center gap-3">
          <img src={logoAsset.url} alt="SAT Sharks" className="h-8 w-auto brightness-0 invert opacity-90" />
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-inverse-on-surface/70">
            © 2024 SAT Sharks. Your path to academic triumph.
          </span>
        </div>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] uppercase tracking-[0.08em] text-inverse-on-surface/70">
          {links.map(l => <li key={l}><a href="#" className="hover:text-inverse-on-surface transition-colors">{l}</a></li>)}
        </ul>
      </div>
    </footer>
  );
}
