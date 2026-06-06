import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Icon } from "../components/common/Icon";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export const Route = createFileRoute("/contact")({
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen bg-background text-on-background animate-fade-up flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary text-on-primary py-20 md:py-28 relative overflow-hidden h-[45vh] min-h-[400px] flex items-center">
          <div aria-hidden className="absolute inset-0 opacity-30">
            <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary-fixed/40 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-secondary-container/30 blur-3xl" />
          </div>
          <div className="relative mx-auto w-full max-w-[1200px] px-6 text-center">
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.02em] md:text-5xl lg:text-6xl">
              Get in Touch
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-on-primary/85 text-lg">
              Have questions about our programs or need help deciding which plan is right for you? Our team is here to help you navigate your journey.
            </p>
          </div>
        </section>
        
        <section className="py-20 relative -mt-24 z-10">
          <div className="mx-auto grid max-w-[1200px] gap-8 px-6 lg:grid-cols-5 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl bg-surface-container-lowest text-on-surface p-8 shark-shadow border border-outline-variant/40 hover-lift">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary mb-4">
                  <Icon name="mail" className="text-[26px]" />
                </div>
                <h3 className="font-headline text-xl font-semibold">Email Us</h3>
                <p className="mt-2 text-sm text-on-surface-variant mb-4">We usually respond within 24 hours.</p>
                <a href="mailto:hello@satsharks.com" className="font-mono text-[14px] font-semibold text-primary hover:underline">hello@satsharks.com</a>
              </div>
              <div className="rounded-2xl bg-surface-container-lowest text-on-surface p-8 shark-shadow border border-outline-variant/40 hover-lift">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary mb-4">
                  <Icon name="call" className="text-[26px]" />
                </div>
                <h3 className="font-headline text-xl font-semibold">Call Us</h3>
                <p className="mt-2 text-sm text-on-surface-variant mb-4">Available Mon-Fri, 9am-6pm EST.</p>
                <a href="tel:+18005550199" className="font-mono text-[14px] font-semibold text-primary hover:underline">+1 (800) 555-0199</a>
              </div>
            </div>
            
            <form
              onSubmit={(e) => e.preventDefault()}
              className="lg:col-span-3 rounded-2xl bg-surface-container-lowest text-on-surface p-8 md:p-10 shark-shadow border border-outline-variant/40"
            >
              <h3 className="font-headline text-2xl font-semibold">Send us a message</h3>
              <div className="mt-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="First Name" type="text" placeholder="Jane" required />
                  <Input label="Last Name" type="text" placeholder="Doe" required />
                </div>
                <Input label="Email Address" type="email" placeholder="you@example.com" required />
                <div>
                  <label className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                    Inquiry Category
                  </label>
                  <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option>General Inquiry</option>
                    <option>SAT Prep Programs</option>
                    <option>College Counseling</option>
                    <option>Billing & Subscriptions</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tell us about your goals..."
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    required
                  />
                </div>
                <Button type="submit" className="w-full py-3.5 mt-4">
                  Submit Inquiry <Icon name="send" className="text-[18px]" />
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
