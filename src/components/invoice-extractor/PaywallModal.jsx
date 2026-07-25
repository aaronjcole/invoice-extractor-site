import { useState } from "react";
import { X, Sparkles, Clock, Infinity as InfinityIcon, Check } from "lucide-react";
import { useModalTrap } from "@/hooks/useModalTrap";

const TIERS = [
  {
    id: "pass",
    icon: Clock,
    name: "24-Hour Pass",
    price: "$9",
    features: ["Unlimited scans for 24 hours", "No saved run history"],
    cta: "Get 24-hour pass",
  },
  {
    id: "lifetime",
    icon: InfinityIcon,
    name: "Lifetime Account",
    price: "$79",
    best: true,
    features: ["Unlimited scans forever", "Saved run history across sessions"],
    cta: "Get lifetime access",
  },
];

export default function PaywallModal({ onClose, headline = "Upgrade to keep going" }) {
  const [notice, setNotice] = useState("");
  const panelRef = useModalTrap(true, onClose);

  // Payments are not wired up yet — surface a clear placeholder instead of
  // attempting any real checkout call.
  const handleChoose = () => setNotice("Checkout is coming very soon!");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-8 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto scrollbar-thin rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8"
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent-ink">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 id="paywall-title" className="mt-4 font-display text-2xl font-semibold text-foreground">
            {headline}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You've used your 3 free scans. Pick a plan for unlimited extraction.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={`relative rounded-2xl border p-5 ${
                t.best ? "border-accent ring-1 ring-accent" : "border-border"
              } bg-background`}
            >
              {t.best && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-[11px] font-semibold text-accent-foreground">
                  Best value
                </span>
              )}
              <t.icon className="h-6 w-6 text-accent-ink" aria-hidden="true" />
              <h2 className="mt-3 font-display text-lg font-semibold text-foreground">{t.name}</h2>
              <p className="mt-1 font-display text-3xl font-semibold text-foreground">{t.price}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-verified" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleChoose}
                className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        {notice && (
          <p className="mt-4 text-center text-sm font-medium text-accent-ink">{notice}</p>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}