import { Link } from "react-router-dom";
import {
  ScanText, Sheet, Sparkles, ShieldCheck, ShieldAlert, MapPin,
} from "lucide-react";
import ProfileMenu from "@/components/invoice-extractor/ProfileMenu";
import { useAuth } from "@/lib/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen paper-grain">
      <Header />
      <Hero />
      <FeatureRow />
      <HowItWorks />
      <Footer />
    </div>
  );
}

function Header() {
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
        <Link
          to="/app"
          className="hidden items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
        >
          Open the tool <span aria-hidden="true">→</span>
        </Link>
        <ThemeToggle />
        {isAuthenticated ? (
          <ProfileMenu />
        ) : (
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent-ink" aria-hidden="true" />
            Vision AI · typed &amp; handwritten
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground text-balance sm:text-6xl">
            Turn a stack of<br />
            invoices into a clean<br />
            <span className="relative inline-block text-accent-ink">
              contact sheet
              <svg
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-2.5 w-full text-accent"
                aria-hidden="true"
              >
                <path d="M3 7 C 40 2, 80 11, 120 6 S 180 3, 197 7" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground text-balance">
            Upload or photograph invoices — typed or handwritten — and pull out customer names, phones, emails, and addresses. Anything uncertain gets flagged for a human. Export to CSV or Excel in one click.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Start extracting <span aria-hidden="true">→</span>
            </Link>
            <span className="text-sm text-muted-foreground">Free to try.</span>
          </div>
        </div>

        <InvoiceMockup />
      </div>
    </section>
  );
}

function InvoiceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_-24px_rgba(60,30,10,0.4)]">
        <div
          className="scanline pointer-events-none absolute inset-x-0 z-10 h-14 -translate-y-1/2"
          style={{
            background:
              "linear-gradient(to bottom, transparent, hsl(var(--accent) / 0.14) 42%, hsl(var(--accent) / 0.85) 50%, hsl(var(--accent) / 0.14) 58%, transparent)",
          }}
          aria-hidden="true"
        />
        <div className="flex items-center justify-between">
          <div className="h-6 w-16 rounded-md bg-primary/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2.5 w-3/4 rounded bg-muted" />
          <div className="h-2.5 w-1/2 rounded bg-muted" />
        </div>
        <div className="mt-5 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-ink">Bill To</p>
          <p className="mt-1.5 font-display text-lg font-semibold text-foreground">Joe Smith</p>
          <p className="mt-0.5 text-sm text-muted-foreground">1234 Country Lane · Tampa, FL</p>
          <p className="mt-0.5 font-mono text-sm text-foreground">(555) 257-9994</p>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-verified/15 px-3 py-1 text-xs font-semibold text-verified">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-review/15 px-3 py-1 text-xs font-semibold text-review">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Check ZIP
          </span>
        </div>
      </div>
    </div>
  );
}

function FeatureRow() {
  const items = [
    { icon: ScanText, title: "Reads anything", body: "Typed or handwritten, single images or multi-page PDFs. Every page is scanned for the billing block." },
    { icon: ShieldAlert, title: "Flags the doubt", body: "Ambiguous digits and low-confidence fields are highlighted so a person double-checks only what matters." },
    { icon: MapPin, title: "Verifies addresses", body: "Extracted addresses are checked against a geocoder — an outage never falsely flags your whole batch." },
    { icon: Sheet, title: "Exports clean", body: "Download an Excel-ready CSV (accents intact) or a real .xlsx, both carrying the review flags." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-ink">
              <it.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{it.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Add invoices", d: "Drag in files or snap a photo right in the browser." },
    { n: "02", t: "Extract", d: "AI reads each one and builds a living spreadsheet as it goes." },
    { n: "03", t: "Review & export", d: "Fix flagged rows, then download CSV or Excel." },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
      <div className="rounded-3xl border border-border bg-secondary/40 p-8 sm:p-10">
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Three steps to a spreadsheet</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n}>
              <span className="font-mono text-2xl font-bold text-accent-ink">{s.n}</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="hidden border-t border-border bg-secondary/30 pb-safe md:block">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        <p>Invoice Extractor — customer contacts from invoices, extracted with vision AI.</p>
        <p className="mt-1 text-xs">Invoices are uploaded only to read them, and extracted results stay in this browser until you clear them. Nothing is shared with third parties.</p>
        <p className="mt-1 text-xs">Address checks © OpenStreetMap contributors.</p>
      </div>
    </footer>
  );
}