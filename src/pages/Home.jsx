import { Link } from "react-router-dom";
import {
  ScanText, Sheet, Sparkles, ShieldCheck, ShieldAlert, MapPin, Infinity as InfinityIcon, CalendarDays,
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
      <WhoUsesIt />
      <PricingTeaser />
      <FaqSection />
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
        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            to="/pricing"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Pricing
          </Link>
          <Link
            to="/app"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open the tool <span aria-hidden="true">→</span>
          </Link>
        </nav>
        <div className="flex items-center gap-2">
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
            <span className="text-sm text-muted-foreground">3 free scans, no card needed.</span>
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
    { n: "01", t: "Add invoices", d: "Drag in files or snap a photo right in the browser. Supports JPG, PNG, PDF, and multi-page scans." },
    { n: "02", t: "Extract", d: "AI reads each one and builds a living spreadsheet as it goes. Low-DPI or faded images are enhanced automatically." },
    { n: "03", t: "Review & export", d: "Fix flagged rows, then download CSV or Excel. Address fields are cross-checked against a geocoder." },
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

function WhoUsesIt() {
  const personas = [
    {
      label: "HVAC & plumbing contractors",
      body: "Process a season's worth of service invoices at the end of the month. Pull every customer's contact into a spreadsheet in minutes instead of hours.",
    },
    {
      label: "Accountants & bookkeepers",
      body: "Extract billing contacts from client invoice bundles without re-keying a single address. Flags let you quickly find the ones worth a second look.",
    },
    {
      label: "Office administrators",
      body: "Digitize paper or faxed invoices into a clean, sortable contact list. Works on handwritten notes just as well as laser-printed receipts.",
    },
    {
      label: "Field service businesses",
      body: "Snap a photo of an invoice on-site and have the customer's contact details in a spreadsheet before you get back to the truck.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="mb-6 font-display text-2xl font-semibold text-foreground sm:text-3xl">Who uses Invoice Extractor?</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {personas.map((p) => (
          <div key={p.label} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">{p.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-border bg-secondary/40 p-8 sm:p-10">
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Simple pricing — start free</h2>
        <p className="mt-2 text-muted-foreground">Try the first three invoices at no cost. Upgrade when you're ready.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-2xl font-semibold text-foreground">Free</p>
            <p className="text-sm text-muted-foreground">3 scans to get started</p>
            <p className="mt-3 text-sm text-foreground">No card required. See the AI work on your real invoices first.</p>
          </div>
          <div className="relative rounded-2xl border border-accent p-5 ring-1 ring-accent bg-card">
            <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-3 py-0.5 text-[11px] font-semibold text-accent-foreground">Best value</span>
            <InfinityIcon className="h-5 w-5 text-accent-ink" aria-hidden="true" />
            <p className="mt-2 font-display text-2xl font-semibold text-foreground">$19 <span className="text-base font-normal text-muted-foreground">one-time</span></p>
            <p className="text-sm text-muted-foreground">Lifetime access</p>
            <p className="mt-3 text-sm text-foreground">Unlimited scans forever. Pay once, done.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <CalendarDays className="h-5 w-5 text-accent-ink" aria-hidden="true" />
            <p className="mt-2 font-display text-2xl font-semibold text-foreground">$79 <span className="text-base font-normal text-muted-foreground">/ year</span></p>
            <p className="text-sm text-muted-foreground">Annual plan</p>
            <p className="mt-3 text-sm text-foreground">Unlimited scans. Easy to expense. Renews annually.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try free now →
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-card px-5 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border shadow-sm hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Compare plans
          </Link>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "What types of documents can Invoice Extractor process?",
    a: "Any image or PDF containing an invoice — JPEG, PNG, and multi-page PDF are all supported. It handles typed invoices, handwritten receipts, faxed copies, and low-resolution scans. Images are enhanced automatically before the AI reads them.",
  },
  {
    q: "What contact information does it extract?",
    a: "For each invoice it pulls the customer's name, phone number, email address, street address, city, state, and ZIP code. It looks specifically for the 'Bill To' or 'Customer' block, not the vendor's own details.",
  },
  {
    q: "Can it read handwritten invoices?",
    a: "Yes. The vision AI is trained to handle handwriting, though confidence will naturally be lower on hard-to-read handwriting. Uncertain fields are flagged for human review rather than silently guessed.",
  },
  {
    q: "How does address verification work?",
    a: "After extraction, US addresses are cross-checked against the US Census geocoder. If the address matches a known location and the extraction confidence is high, it's marked 'Verified'. If the geocoder can't confirm it, the row is flagged for review. International addresses are not geocoded but are still extracted.",
  },
  {
    q: "Is my invoice data kept private?",
    a: "Files are uploaded only to read them. Extracted results are stored only in your browser's local storage — they're not sent to any third-party service. Nothing about your invoices is shared beyond the extraction step.",
  },
  {
    q: "What export formats are supported?",
    a: "CSV (UTF-8 with BOM, compatible with Excel and Google Sheets) and real .xlsx files. Both formats carry the review flags so you can filter uncertain rows in your spreadsheet.",
  },
  {
    q: "What happens when a field is uncertain?",
    a: "Uncertain fields are highlighted in the results table and marked for review. You can fix them inline before exporting. Confidence level (high / medium / low) is set per-extraction, and any field that was ambiguous appears in the 'fields to verify' list.",
  },
  {
    q: "Do I need to create an account?",
    a: "You need an account to run extractions. The first three scans are free with no credit card required. Sign up with Google or email.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. The app works in any modern mobile browser, and there's a built-in camera capture mode so you can photograph invoices on-site and extract contacts immediately.",
  },
  {
    q: "What's the difference between the Lifetime and Annual plans?",
    a: "Lifetime is a single one-time payment of $19 that gives you unlimited scans forever. Annual is $79 billed once per year — a good fit for businesses that prefer predictable, expense-able subscriptions over a one-time purchase.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-12">
      <h2 className="mb-8 font-display text-2xl font-semibold text-foreground sm:text-3xl">Frequently asked questions</h2>
      <div className="space-y-6">
        {FAQS.map((item) => (
          <div key={item.q}>
            <h3 className="font-semibold text-foreground">{item.q}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Start extracting — 3 free scans →
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30 pb-safe">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ScanText className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-display font-semibold text-foreground">Invoice Extractor</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Customer contacts from invoices, extracted with vision AI.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Product</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/app" className="hover:text-foreground hover:underline">Try the tool</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground hover:underline">Pricing</Link></li>
              <li><Link to="/#how" className="hover:text-foreground hover:underline">How it works</Link></li>
              <li><Link to="/#faq" className="hover:text-foreground hover:underline">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Account</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/register" className="hover:text-foreground hover:underline">Create account</Link></li>
              <li><Link to="/login" className="hover:text-foreground hover:underline">Sign in</Link></li>
              <li><Link to="/settings" className="hover:text-foreground hover:underline">Settings</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>Invoices are uploaded only to read them, and extracted results stay in this browser until you clear them. Nothing is shared with third parties.</p>
          <p className="mt-1">Address checks © OpenStreetMap contributors. Geocoding via US Census Bureau geocoder.</p>
        </div>
      </div>
    </footer>
  );
}
