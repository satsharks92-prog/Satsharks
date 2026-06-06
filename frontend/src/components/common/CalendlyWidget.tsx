import { Icon } from "./Icon";

export function CalendlyWidget() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
      <div className="flex items-center gap-3 text-primary-fixed-dim">
        <Icon name="calendar_month" className="text-[28px]" />
        <span className="font-mono text-[12px] uppercase tracking-[0.08em]">
          Calendly Widget
        </span>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-lg text-center text-xs leading-[1] flex items-center justify-center font-mono ${[3, 8, 15, 22].includes(i) ? "bg-primary text-on-primary font-bold" : "bg-white/5 text-inverse-on-surface/60"}`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-inverse-on-surface/60 font-mono">
        Available slots highlighted
      </p>
    </div>
  );
}
