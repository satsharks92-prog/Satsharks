import { Icon } from "../common/Icon";
import { Button } from "../ui/Button";
import heroAsset from "@/assets/hero.png.asset.json";
import { Link } from "@tanstack/react-router";

export function Hero() {
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
            Personalized SAT preparation, expert college counseling, essay reviews, and proven
            strategies designed to give you the competitive edge in high-stakes testing.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/subscriptions"
              className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-on-primary shark-shadow hover:bg-primary-container transition-colors"
            >
              Book Class <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-3.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
            >
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
            <img
              src={heroAsset.url}
              alt="SAT Sharks platform illustration"
              className="animate-float w-full rounded-2xl shark-shadow"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
