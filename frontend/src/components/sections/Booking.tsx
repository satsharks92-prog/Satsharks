import { Icon } from "../common/Icon";
import { CalendlyWidget } from "../common/CalendlyWidget";
import { useState } from "react";
import { openCalendly } from "../../lib/calendly";

export function Booking() {
  const [isOpeningCalendly, setIsOpeningCalendly] = useState(false);
  const [calendlyError, setCalendlyError] = useState("");

  const handleBookConsultation = async () => {
    setCalendlyError("");
    setIsOpeningCalendly(true);

    try {
      await openCalendly();
    } catch (error) {
      setCalendlyError(error instanceof Error ? error.message : "Unable to open Calendly.");
    } finally {
      setIsOpeningCalendly(false);
    }
  };

  return (
    <section id="booking" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="rounded-2xl bg-inverse-surface text-inverse-on-surface p-8 md:p-14 shark-shadow relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
          />
          <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-primary-fixed-dim">
                Booking
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.01em] md:text-4xl">
                Schedule Your Session Now
              </h2>
              <p className="mt-4 text-inverse-on-surface/80">
                Book a consultation with an expert advisor to discuss your goals and how we can help
                you achieve them.
              </p>
              <button
                type="button"
                onClick={handleBookConsultation}
                disabled={isOpeningCalendly}
                className="btn-shimmer mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-on-primary hover:bg-primary-container transition-colors"
              >
                <Icon name="calendar_month" className="text-[18px]" />
                {isOpeningCalendly ? "Opening..." : "Book Consultation"}
              </button>
              {calendlyError && (
                <p className="mt-3 text-sm font-medium text-primary-fixed-dim">{calendlyError}</p>
              )}
            </div>
            <CalendlyWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
