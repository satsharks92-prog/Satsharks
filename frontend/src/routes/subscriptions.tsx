import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/ui/Button";

export const Route = createFileRoute("/subscriptions")({
  component: Subscriptions,
});

function Subscriptions() {
  const plans = [
    {
      name: "Local Free",
      price: "$0",
      period: "forever",
      description: "Basic access for local students",
      features: ["Access to free diagnostic test", "Basic study resources", "Community forum access", "1 college prep webinar/month"],
      highlight: false,
    },
    {
      name: "Local Paid",
      price: "$199",
      period: "per month",
      description: "Premium prep for local students",
      features: ["Everything in Local Free", "Full proprietary curriculum", "4 expert mentoring sessions/month", "Unlimited essay reviews", "Personalized study plan"],
      highlight: true,
    },
    {
      name: "International Free",
      price: "$0",
      period: "forever",
      description: "Basic access for international students",
      features: ["Access to free diagnostic test", "Basic study resources", "International admissions guide", "Visa basics webinar"],
      highlight: false,
    },
    {
      name: "International Paid",
      price: "$299",
      period: "per month",
      description: "Complete international prep",
      features: ["Everything in International Free", "Full proprietary curriculum", "4 expert mentoring sessions/month", "Unlimited essay reviews", "Comprehensive visa & admissions counseling"],
      highlight: true,
    },
  ];

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
                Choose Your <span className="text-primary">Path to Success</span>
              </h1>
              <p className="mt-6 text-lg text-on-surface-variant">
                Whether you're studying locally or applying from abroad, we have a plan tailored to your specific needs and goals.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
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
                    <h3 className={`font-headline text-xl font-semibold ${plan.highlight ? "text-on-primary" : "text-on-surface"}`}>
                      {plan.name}
                    </h3>
                    <p className={`mt-2 text-sm ${plan.highlight ? "text-on-primary/80" : "text-on-surface-variant"}`}>
                      {plan.description}
                    </p>
                  </div>
                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold">{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? "text-on-primary/80" : "text-on-surface-variant"}`}>
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
                        <span className={plan.highlight ? "text-on-primary/90" : "text-on-surface-variant"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.highlight ? "glass" : "outline"}
                    className="w-full py-3.5"
                  >
                    {plan.price === "$0" ? "Get Started Free" : "Subscribe Now"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
