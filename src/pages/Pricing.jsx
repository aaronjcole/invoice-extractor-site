import { Link } from "react-router-dom";
import { ScanText, Check, X, Infinity as InfinityIcon, CalendarDays, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileMenu from "@/components/invoice-extractor/ProfileMenu";

const FEATURES = [
  { label: "Invoice scans", free: "3 (trial)", annual: "Unlimited", lifetime: "Unlimited" },
  { label: "Typed & handwritten invoices", free: true, lifetime: true, annual: true },
  { label: "Multi-page PDFs", free: true, lifetime: true, annual: true },
  { label: "Address verification", free: true, lifetime: true, annual: true },
  { label: "CSV & Excel export", free: true, lifetime: true, annual: true },
  { label: "Image enhancement (auto)", free: true, lifetime: true, annual: true },
  { label: "Mobile camera capture", free: true, lifetime: true, annual: true },
  { label: "Saved run history", free: false, lifetime: true, annual: true },
  { label: "All future features", free: false, lifetime: true, annual: true },
];

const FAQS = [
  {
    q: "What counts as a 'scan'?",
    a: "Each file you submit for extraction — whether it's a single-page image, a multi-page PDF, or a camera photo — uses one scan.",
  },
  {
    q: "Can I try it before buying?",
    a: "Yes. You get 3 free scans with no credit card required. Create an account and start extracting immediately.",
  },
  {
    q: "What's the difference between Annual and Lifetime?",
    a: "Annual is $19/year — billed once per year, cancel anytime. Lifetime is a single payment of $79 that gives you unlimited access forever. If you plan to use the tool for more than four years, Lifetime pays for itself.",
  },
  {
    q: "Can I get a refund?",
    a: "If you're not satisfied within 7 days of purchase, contact us for a full refund.",
  },
  {
    q: "Is payment secure?",
    a: "Yes. Payments are handled by Stripe — we never see or store your credit card details.",
  },
  {
    q: "What happens when my Annual plan expires?",
    a: "Stripe will attempt to renew your subscription automatically. If the renewal fails, your access reverts to the 3-scan free tier until you renew.",
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen paper-grain">
      <PricingHeader />
      <main>
        <PricingHero />
        <TiersGrid />
        <FeatureTable />
        <PricingFaq />
        <BottomCta />
      </main>
      <PricingFooter />
    </div>
  );
}

function PricingHeader() {
  const { isAuthenticated } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-safe backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ScanText className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Invoice Extractor</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <ProfileMenu />
          ) : (
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try free
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function PricingHero() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-accent-ink" aria-hidden="true" />
        Simple, honest pricing
      </span>
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Start free. Upgrade when you're ready.
      </h1>
      <p className="mt-4 text-lg text-muted-foreground text-balance">
        Three free scans with no card required. If you need more, pick the plan that fits your workflow.
      </p>
    </section>
  );
}

function TiersGrid() {
  return (
    <section aria-labelledby="tiers-heading" className="mx-auto max-w-5xl px-4 pb-16">
      <h2 id="tiers-heading" className="sr-only">Pricing plans</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        <TierCard
          name="Free"
          price="$0"
          priceNote="3 scans included"
          description="Get started instantly. No credit card needed."
          features={["3 invoice scans", "All extraction fields", "CSV & Excel export", "Address verification"]}
          cta="Start free"
          ctaTo="/app"
          ctaVariant="secondary"
        />
        <TierCard
          name="Annual"
          price="$19"
          priceNote="per year"
          description="Best for steady, ongoing use — cancel anytime."
          features={["Unlimited scans for 12 months", "All features included", "Saved run history", "Renews automatically"]}
          cta="Start annual plan"
          ctaTo="/app"
          ctaVariant="secondary"
          icon={CalendarDays}
        />
        <TierCard
          name="Lifetime"
          price="$79"
          priceNote="one-time payment"
          description="Pay once. Extract invoices forever."
          features={["Unlimited scans forever", "All features, always", "Saved run history", "Future updates included"]}
          cta="Get lifetime access"
          ctaTo="/app"
          ctaVariant="primary"
          best
          icon={InfinityIcon}
        />
      </div>
    </section>
  );
}

function TierCard({ name, price, priceNote, description, features, cta, ctaTo, ctaVariant, best, icon: Icon }) {
  return (
    <div className={`relative rounded-2xl border p-6 ${best ? "border-accent ring-1 ring-accent" : "border-border"} bg-card`}>
      {best && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-[11px] font-semibold text-accent-foreground">
          Best value
        </span>
      )}
      {Icon && <Icon className="h-7 w-7 text-accent-ink" aria-hidden="true" />}
      <h3 className="mt-3 font-display text-xl font-semibold text-foreground">{name}</h3>
      <p className="mt-1 font-display text-4xl font-semibold text-foreground">{price}</p>
      <p className="text-sm text-muted-foreground">{priceNote}</p>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-verified" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to={ctaTo}
        className={`mt-6 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          ctaVariant === "primary"
            ? "bg-accent text-accent-foreground hover:bg-accent/90"
            : "bg-secondary text-foreground ring-1 ring-border hover:bg-secondary/80"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function FeatureTable() {
  const Cell = ({ val }) => {
    if (val === true) return <Check className="mx-auto h-4 w-4 text-verified" aria-label="Included" />;
    if (val === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label="Not included" />;
    return <span className="text-sm text-foreground">{val}</span>;
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pb-20">
      <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">Full feature comparison</h2>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-5 py-3 text-left font-semibold text-foreground">Feature</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Free</th>
              <th className="px-4 py-3 text-center font-semibold text-accent-ink">Lifetime</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Annual</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-secondary/20"}>
                <td className="px-5 py-3 text-foreground">{row.label}</td>
                <td className="px-4 py-3 text-center"><Cell val={row.free} /></td>
                <td className="px-4 py-3 text-center"><Cell val={row.lifetime} /></td>
                <td className="px-4 py-3 text-center"><Cell val={row.annual} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PricingFaq() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-20">
      <h2 className="mb-8 font-display text-2xl font-semibold text-foreground">Pricing questions</h2>
      <div className="space-y-6">
        {FAQS.map((item) => (
          <div key={item.q}>
            <h3 className="font-semibold text-foreground">{item.q}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomCta() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 text-center">
      <div className="rounded-3xl border border-border bg-secondary/40 p-10">
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Ready to clean up your invoices?</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Three free scans, no credit card. See what the AI pulls out of your real invoices before you commit.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Start free — no card needed
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-card px-6 py-3 text-sm font-semibold text-foreground ring-1 ring-border shadow-sm hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Learn more
          </Link>
        </div>
      </div>
    </section>
  );
}

function PricingFooter() {
  return (
    <footer className="hidden border-t border-border bg-secondary/30 pb-safe md:block">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        <p>Invoice Extractor — customer contacts from invoices, extracted with vision AI.</p>
        <p className="mt-1 text-xs">Payments processed securely by Stripe. We never store card details.</p>
      </div>
    </footer>
  );
}
