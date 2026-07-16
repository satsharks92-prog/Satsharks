import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

export const Route = createFileRoute("/sat")({
  component: SATPrepPage,
});



/*
  GEO-PRICING LOGIC
  -----------------
  In this demo: detects Pakistan via browser timezone ("Asia/Karachi").
  
  On your real website, use IP geolocation for accuracy:
  - Cloudflare: request.cf.country (free, built-in)
  - Vercel: request.geo.country (free, built-in)
  - API: fetch('https://ipapi.co/json/') → response.country_code
  
  Replace the useEffect below with your preferred method.
*/

function useRegion() {
  const [region, setRegion] = useState("loading");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Asia/Karachi = Pakistan
      const isPK = tz === "Asia/Karachi";
      setRegion(isPK ? "pk" : "intl");
    } catch {
      setRegion("intl");
    }
  }, []);

  return region;
}

// ── Pricing Config (edit these) ──
const PRICING = {
  pk: {
    group: { amount: "Rs 40,000", period: "/ full course" },
    oneOnOne: { amount: "Rs 100,000", period: "/ month" },
  },
  intl: {
    group: { amount: "$400", period: "/ full course" },
    oneOnOne: { amount: "$800", period: "/ month" },
  },
};

// ── Icons ──
const CheckIcon = ({ color = "#3B7DD8" }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
    <circle cx="10" cy="10" r="10" fill={color} opacity="0.12" />
    <path d="M6 10.5L8.5 13L14 7.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FireIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
    <circle cx="10" cy="10" r="10" fill="#F5A623" opacity="0.12" />
    <path d="M10 3C10 3 6 7.5 6 11C6 13.2 7.8 15 10 15C12.2 15 14 13.2 14 11C14 7.5 10 3 10 3Z" fill="#F5A623" />
    <path d="M10 9C10 9 8.5 11 8.5 12.5C8.5 13.3 9.2 14 10 14C10.8 14 11.5 13.3 11.5 12.5C11.5 11 10 9 10 9Z" fill="#FFFFFF" />
  </svg>
);

// ── Feature Data ──
const groupFeatures = [
  {
    heading: "Intensive Weekly Schedule",
    bullets: [
      "6 live online sessions every week — 3 English, 3 Math",
      "23 sessions per month with 7 dedicated practice tests",
      "Consistent structure that builds momentum week after week",
    ],
  },
  {
    heading: "Real SAT Practice, Not Random Questions",
    bullets: [
      "Weekly full-length tests using actual past SAT papers",
      "You practice under real conditions — no surprises on test day",
      "Detailed score analysis after every test to track your growth",
    ],
  },
  {
    heading: "Desmos, Shortcuts & Strategy",
    bullets: [
      "Dedicated time mastering Desmos — the graphing calculator allowed in SAT Math",
      "English shortcuts and tricks that save critical minutes per section",
      "Math strategies that turn hard problems into quick wins",
    ],
  },
  {
    heading: "Full Support, Nothing Extra to Buy",
    bullets: [
      "All study materials provided — books, past papers, question banks",
      "Your instructor's number is yours — ask questions anytime after class",
      "After your first month, you get a personal 1-on-1 session with your instructor",
    ],
  },
];

const oneOnOneFeatures = [
  {
    heading: "Your Own Dedicated Tutor",
    bullets: [
      "Every session is built around your specific strengths and weaknesses",
      "Diagnostic test on day one to build a custom study roadmap",
      "Flexible scheduling — sessions happen when they work for you",
    ],
  },
  {
    heading: "The Same Proven Curriculum, Personalized",
    bullets: [
      "Same 6-session weekly intensity — 3 English, 3 Math",
      "Full-length SAT past papers every week under timed conditions",
      "Individual score breakdowns with targeted action plans after each test",
    ],
  },
  {
    heading: "Deeper Desmos & Strategy Training",
    bullets: [
      "1-on-1 Desmos walkthroughs tailored to the question types you struggle with",
      "Personalized shortcut toolkit for both English and Math",
      "Advanced techniques for students targeting 1500+",
    ],
  },
  {
    heading: "Always-On Access & Materials",
    bullets: [
      "All books, past papers, and resources included — nothing extra to buy",
      "Direct WhatsApp access to your tutor — not a group chat, just you",
      "Continuous progress tracking and strategy adjustments between sessions",
    ],
  },
];

interface FeatureBlockProps {
  heading: string;
  bullets: string[];
  IconComp: React.ComponentType;
}

// ── Components ──
function FeatureBlock({ heading, bullets, IconComp }: FeatureBlockProps) {
  return (
    <div className="mb-6 last:mb-0">
      <h4 className="font-body font-bold text-[15px] text-on-surface tracking-tight mb-2">
        {heading}
      </h4>
      <div className="flex flex-col gap-2.5">
        {bullets.map((b: string, i: number) => (
          <div key={i} className="flex gap-2.5 items-start">
            <IconComp />
            <span className="text-on-surface-variant text-sm leading-relaxed">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PriceBadgeProps {
  amount: string;
  period: string;
  accent: string;
}

function PriceBadge({ amount, period, accent }: PriceBadgeProps) {
  const isGold = accent === "gold";
  return (
    <div className={`inline-flex items-baseline gap-1 rounded-xl px-4 py-2 border ${
      isGold ? "bg-accent/10 border-accent/25" : "bg-secondary/10 border-secondary/25"
    }`}>
      <span className={`text-2xl font-extrabold font-mono tracking-tight ${
        isGold ? "text-[#D4911E]" : "text-secondary"
      }`}>{amount}</span>
      <span className={`text-xs font-semibold ${
        isGold ? "text-[#B07A15]" : "text-secondary/80"
      }`}>{period}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="inline-block w-40 h-[38px] rounded-xl bg-surface-container-high animate-pulse" />
  );
}

// ── Main Page ──
function SATPrepPage() {
  const region = useRegion();
  const [activeTier, setActiveTier] = useState<number | null>(null);
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);

  const prices = region === "loading" ? null : PRICING[region as keyof typeof PRICING];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-surface-container-low min-h-screen font-body text-on-surface">
          {/* Hero */}
          <div className="bg-gradient-to-br from-[#0B1929] via-[#162D4D] to-[#1A3558] py-10 px-6 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/30 rounded-full px-4 py-1.5 mb-6">
                <span className="font-mono text-xs font-bold text-accent tracking-widest uppercase">SAT / ACT Preparation</span>
              </div>
              <h1 className="font-display text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight md:text-5xl">
                Stop Guessing.<br />
                <span className="text-[#5BA3F5]">Start Scoring.</span>
              </h1>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                6 live sessions a week. Actual past papers every week. Desmos mastery. Shortcuts that save minutes. Everything you need — nothing you don't.
              </p>
            </div>
          </div>

          {/* Stat strip */}
          <div className="bg-[#0F1B2D] border-b border-[#3B7DD8]/15">
            <div className="max-w-2xl mx-auto flex justify-center gap-8 md:gap-16 py-4 px-6">
              {[
                ["6", "Live Sessions / Week"],
                ["23", "Sessions / Month"],
                ["7", "Practice Tests / Month"],
              ].map(([num, label], i) => (
                <div key={i} className="text-center">
                  <div className="font-body text-2xl md:text-3xl font-extrabold text-accent tracking-tight">{num}</div>
                  <div className="font-mono text-[10px] md:text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="max-w-[880px] mx-auto px-6">

            {/* Tier Toggle */}
            <div className="flex justify-center gap-1 mt-8 mx-auto bg-surface-container-lowest rounded-2xl p-1.5 shadow-sm border border-outline-variant/40 max-w-sm">
              {["Group", "1-on-1"].map((label, i) => {
                const isActive = activeTier === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveTier(isActive ? null : i)}
                    className={`flex-1 py-3 px-4 rounded-xl border-none cursor-pointer text-sm font-semibold transition-all duration-300 ${
                      isActive 
                        ? (i === 0 ? "bg-primary text-white shadow-sm" : "bg-[#F5A623] text-white shadow-sm") 
                        : "bg-transparent text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {label} Sessions
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pb-12">

              {/* ── Group Card ── */}
              <div
                onMouseEnter={() => setHoveredTier(0)}
                onMouseLeave={() => setHoveredTier(null)}
                onClick={() => setActiveTier(activeTier === 0 ? null : 0)}
                className={`bg-surface-container-lowest rounded-2xl p-8 cursor-pointer transition-all duration-300 border-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                  activeTier === 0 ? "border-primary" : "border-outline-variant/30 hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" className="text-primary" />
                      <path d="M23 21V19C23 17.14 21.73 15.57 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
                      <circle cx="19" cy="7" r="3" stroke="currentColor" strokeWidth="2" className="text-primary" />
                    </svg>
                  </div>
                  <h3 className="font-body font-bold text-xl text-on-surface">Group Sessions</h3>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-4 pl-12">
                  Learn alongside peers in a structured, high-intensity program designed to push everyone forward.
                </p>
                <div className="pl-12 mb-6">
                  {prices ? (
                    <PriceBadge amount={prices.group.amount} period={prices.group.period} accent="blue" />
                  ) : (
                    <LoadingSkeleton />
                  )}
                </div>

                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    activeTier === 0 ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="border-t border-outline-variant/40 pt-5 mt-2">
                    {groupFeatures.map((f, i) => (
                      <FeatureBlock key={i} heading={f.heading} bullets={f.bullets} IconComp={() => <CheckIcon color="#3B7DD8" />} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs font-bold text-primary">
                  {activeTier === 0 ? "Tap to collapse" : "See full course details"}
                  <span className={`transition-transform duration-300 inline-flex ${activeTier === 0 ? "rotate-180" : "rotate-0"}`}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" /></svg>
                  </span>
                </div>
              </div>

              {/* ── 1-on-1 Card ── */}
              <div
                onMouseEnter={() => setHoveredTier(1)}
                onMouseLeave={() => setHoveredTier(null)}
                onClick={() => setActiveTier(activeTier === 1 ? null : 1)}
                className={`bg-surface-container-lowest rounded-2xl p-8 cursor-pointer transition-all duration-300 border-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 relative overflow-visible ${
                  activeTier === 1 ? "border-accent" : "border-outline-variant/30 hover:border-accent/50"
                }`}
              >
                <div className="absolute -top-3 right-6 bg-accent text-primary text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Maximum Results
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" className="text-accent" />
                    </svg>
                  </div>
                  <h3 className="font-body font-bold text-xl text-on-surface">1-on-1 Sessions</h3>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-4 pl-12">
                  Every session is built around you — your weaknesses, your pace, your target score.
                </p>
                <div className="pl-12 mb-6">
                  {prices ? (
                    <PriceBadge amount={prices.oneOnOne.amount} period={prices.oneOnOne.period} accent="gold" />
                  ) : (
                    <LoadingSkeleton />
                  )}
                </div>

                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    activeTier === 1 ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="border-t border-outline-variant/40 pt-5 mt-2">
                    {oneOnOneFeatures.map((f, i) => (
                      <FeatureBlock key={i} heading={f.heading} bullets={f.bullets} IconComp={FireIcon} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs font-bold text-accent">
                  {activeTier === 1 ? "Tap to collapse" : "See full course details"}
                  <span className={`transition-transform duration-300 inline-flex ${activeTier === 1 ? "rotate-180" : "rotate-0"}`}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent" /></svg>
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center py-12 pb-16">
              <p className="text-sm md:text-base text-on-surface-variant mb-6 max-w-md mx-auto leading-relaxed">
                Not sure which format is right for you? We'll help you decide — no pressure.
              </p>
              <a
                href="https://wa.me/923164514334?text=Hi%20I%20would%20like%20to%20take%20a%20free%20trial%20for%20SAT%20prep%20or%20wanna%20know%20brief%20thing%20about%20SAT%20prep."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-xs font-bold uppercase tracking-[0.08em] text-on-primary shark-shadow hover:bg-accent transition-all duration-300"
              >
                Book a Free Trial Session
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <p className="font-mono text-[10px] md:text-xs text-on-surface-variant/60 mt-4 uppercase tracking-widest">
                satsharks.org  ·  0316 451 4334
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

