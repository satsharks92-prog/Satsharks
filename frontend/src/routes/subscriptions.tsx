import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/ui/Button";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import type { SubscriptionPlan } from "../types";
import { getPlanHeading, getVisiblePlans } from "../lib/plans";

export const Route = createFileRoute("/subscriptions")({
  component: Subscriptions,
});

function Subscriptions() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [error, setError] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<"LOCAL" | "INTERNATIONAL">("LOCAL");

  useEffect(() => {
    if (isAuthLoading) return;

    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      setError("");

      try {
        const res = await api.get("/api/subscriptions/plans");
        if (res.success) {
          setPlans(res.plans);
        } else {
          setError(res.error || "Unable to load plans.");
        }
      } catch (e) {
        console.error("Failed to fetch plans", e);
        setError("Unable to load plans.");
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, [user, isAuthLoading]);

  const activeRegion = user ? user.region : selectedRegion;
  const displayedPlans = user ? plans : getVisiblePlans(plans, selectedRegion);
  const heading = getPlanHeading(activeRegion);

  return (
    <div className="min-h-screen bg-background text-on-background animate-fade-up flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mx-auto max-w-3xl text-center">
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary">
                Pricing & Plans
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold tracking-[-0.02em] md:text-5xl text-on-surface">
                {heading}
              </h1>
              <p className="mt-6 text-lg text-on-surface-variant">
                {user
                  ? "Your available plans are filtered to match your student profile."
                  : "Compare our pricing plans. Choose a plan to create an account and begin your journey."}
              </p>

              {/* Guest Region Toggle */}
              {!user && (
                <div className="mt-8 flex justify-center">
                  <div className="inline-flex rounded-xl bg-surface-container-high p-1 border border-outline-variant/60 shadow-sm">
                    <button
                      onClick={() => setSelectedRegion("LOCAL")}
                      className={`rounded-lg px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        selectedRegion === "LOCAL"
                          ? "bg-primary text-on-primary shadow-md"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                      }`}
                    >
                      Local Plans
                    </button>
                    <button
                      onClick={() => setSelectedRegion("INTERNATIONAL")}
                      className={`rounded-lg px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        selectedRegion === "INTERNATIONAL"
                          ? "bg-primary text-on-primary shadow-md"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                      }`}
                    >
                      International Plans
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isAuthLoading || isLoadingPlans ? (
              <div className="mt-16 text-center font-semibold text-on-surface-variant">
                Loading plans...
              </div>
            ) : error ? (
              <div className="mt-16 rounded-2xl border border-error/30 bg-error/10 p-6 text-center font-medium text-error">
                {error}
              </div>
            ) : displayedPlans.length === 0 ? (
              <div className="mt-16 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 text-center font-medium text-on-surface-variant">
                No plans are available for your student profile yet.
              </div>
            ) : (
              <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
                {displayedPlans.map((plan) => (
                  <div
                    key={plan._id || plan.id || plan.name}
                    className={`relative flex flex-col rounded-3xl p-8 transition-transform hover:-translate-y-2 ${
                      plan.highlight
                        ? "bg-primary text-on-primary shadow-2xl shadow-primary/20"
                        : "bg-surface-container-lowest text-on-surface border border-outline-variant/40 shark-shadow"
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-4 left-0 right-0 mx-auto w-max rounded-full bg-accent px-4 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                        Recommended
                      </div>
                    )}
                    <div className="mb-6">
                      <h3
                        className={`font-headline text-xl font-semibold ${plan.highlight ? "text-on-primary" : "text-on-surface"}`}
                      >
                        {plan.name}
                      </h3>
                      <p
                        className={`mt-2 text-sm ${plan.highlight ? "text-on-primary/80" : "text-on-surface-variant"}`}
                      >
                        {plan.description}
                      </p>
                    </div>
                    <div className="mb-8 flex items-baseline gap-2">
                      <span className="font-display text-4xl font-extrabold">{plan.price}</span>
                      <span
                        className={`text-sm ${plan.highlight ? "text-on-primary/80" : "text-on-surface-variant"}`}
                      >
                        /{plan.period}
                      </span>
                    </div>
                    <ul className="mb-8 flex-1 space-y-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Icon
                            name="check_circle"
                            className={`text-[20px] shrink-0 ${plan.highlight ? "text-primary-fixed" : "text-primary"}`}
                          />
                          <span
                            className={
                              plan.highlight ? "text-on-primary/90" : "text-on-surface-variant"
                            }
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {user ? (
                      <Button
                        variant={plan.highlight ? "glass" : "outline"}
                        className="w-full py-3.5"
                      >
                        {plan.price === "$0" ? "Get Started Free" : "Subscribe Now"}
                      </Button>
                    ) : (
                      <Link
                        to="/auth/login"
                        className="w-full"
                      >
                        <Button
                          variant={plan.highlight ? "glass" : "outline"}
                          className="w-full py-3.5"
                        >
                          {plan.price === "$0" ? "Get Started Free" : "Subscribe Now"}
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
