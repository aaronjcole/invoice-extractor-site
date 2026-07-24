import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ScanText, FileDown, Sheet, RotateCcw, Camera, Sparkles, ShieldCheck, ShieldAlert,
  MapPin, Loader2, Trash2, CheckCircle2,
} from "lucide-react";
import UploadZone from "@/components/invoice-extractor/UploadZone";
import Queue from "@/components/invoice-extractor/Queue";
import ResultsTable from "@/components/invoice-extractor/ResultsTable";
import CameraCapture from "@/components/invoice-extractor/CameraCapture";
import ProfileMenu from "@/components/invoice-extractor/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";
import PullToRefresh from "@/components/invoice-extractor/PullToRefresh";
import { enhanceImage } from "@/lib/imageEnhance";
import { extractFromFile } from "@/lib/extraction";
import { needsReview } from "@/lib/exporters";
import { downloadCsv, downloadXlsx } from "@/lib/exporters";

const STORAGE_KEY = "invoice-extractor:results";

let uid = 0;
const nextId = () => `f${Date.now()}_${uid++}`;

export default function Home() {
  const [queue, setQueue] = useState([]);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [searchParams, setSearchParams] = useSearchParams();
  const cameraOpen = searchParams.get("camera") === "1";
  const openCamera = () =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("camera", "1");
      return next;
    });
  const closeCamera = () =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("camera");
        return next;
      },
      { replace: true }
    );
  const [toast, setToast] = useState(null);
  const [remainingFree, setRemainingFree] = useState(null);

  // Living spreadsheet — persists until download/clear.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setResults(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch {}
  }, [results]);

  const showToast = (msg, tone = "info") => {
    setToast({ msg, tone, id: nextId() });
    setTimeout(() => setToast(null), 4000);
  };

  const addFiles = (files) => {
    const items = files.map((file) => ({
      id: nextId(),
      file,
      status: "pending",
      enhanced: false,
      error: null,
    }));
    setQueue((q) => [...q, ...items]);
  };

  const removeFromQueue = (id) => setQueue((q) => q.filter((i) => i.id !== id));
  const clearQueue = () => setQueue([]);
  const clearDoneQueue = () => setQueue((q) => q.filter((i) => i.status === "pending" || i.status === "running"));

  const removeFromResults = (id) => setResults((r) => r.filter((i) => i.id !== id));
  const clearResults = () => {
    setResults([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshResults = async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setResults(saved ? JSON.parse(saved) : []);
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
  };

  const pendingCount = useMemo(() => queue.filter((i) => i.status === "pending").length, [queue]);
  const reviewCount = useMemo(() => results.filter(needsReview).length, [results]);

  const updateQueueItem = (id, patch) =>
    setQueue((q) => q.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const runExtraction = async () => {
    const pending = queue.filter((i) => i.status === "pending");
    if (!pending.length) return;
    setRunning(true);
    setProgress({ done: 0, total: pending.length });
    let done = 0;
    let halted = null;

    for (const item of pending) {
      updateQueueItem(item.id, { status: "running" });
      try {
        // 1. Client-side enhancement (images only; PDFs untouched).
        let processed = item.file;
        let enhanced = false;
        try {
          const res = await enhanceImage(item.file);
          processed = res.file;
          enhanced = res.enhanced;
        } catch {
          processed = item.file;
        }

        // 2. Upload to get a URL the vision model can read.
        const { file_url } = await base44.integrations.Core.UploadFile({ file: processed });
        if (!file_url) throw new Error("Upload failed.");

        // 3. Server-side extraction: enforces sign-in + free limit + cost cap,
        //    and returns the extracted row + server-verified address status.
        const { result, address_status, remaining_free } = await extractFromFile(file_url, {
          filename: item.file.name,
        });
        if (typeof remaining_free === "number") setRemainingFree(remaining_free);

        const row = {
          id: item.id,
          filename: item.file.name,
          ...result,
          addressCheck: address_status,
        };
        setResults((r) => [row, ...r]);
        updateQueueItem(item.id, { status: "done", enhanced });
      } catch (e) {
        const type = e?.type;
        if (type === "auth_required") {
          updateQueueItem(item.id, { status: "error", error: "Sign in required" });
          halted = "auth";
          break;
        }
        if (type === "payment_required") {
          updateQueueItem(item.id, { status: "error", error: "Free scans used up" });
          showToast("You've used your 3 free scans — upgrade to continue", "warn");
          halted = "paywall";
          break;
        }
        if (type === "capacity") {
          updateQueueItem(item.id, { status: "error", error: "Service busy" });
          showToast("Service is at capacity — please try again shortly.", "warn");
          halted = "capacity";
          break;
        }
        updateQueueItem(item.id, { status: "error", error: e.message || "Extraction failed" });
      }
      done += 1;
      setProgress({ done, total: pending.length });
    }

    setRunning(false);
    if (halted === "auth") {
      const next = window.location.pathname + window.location.search + window.location.hash;
      base44.auth.redirectToLogin(next);
      return;
    }
    if (!halted) showToast("Extraction complete", "success");
  };

  const startOver = () => {
    setQueue([]);
    clearResults();
  };

  return (
    <div className="min-h-screen paper-grain">
      <Header />
      <Hero />
      <FeatureRow />
      <HowItWorks />

      <main id="tool" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-28 md:pb-24">
        {/* Step 1: add files */}
        <section aria-labelledby="step-add" className="mb-8">
          <SectionStep n={1} title="Add invoices" id="step-add" />
          <UploadZone onFiles={addFiles} disabled={running} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => (cameraOpen ? closeCamera() : openCamera())}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Camera className="h-4 w-4 text-accent-ink" aria-hidden="true" />
              {cameraOpen ? "Hide camera" : "Take a photo"}
            </button>
            <p className="text-xs text-muted-foreground">
              Tip: hand-written, low-DPI, or faded scans are enhanced automatically before reading.
            </p>
          </div>
          {cameraOpen && (
            <div className="mt-3 max-w-md animate-fade-in-up">
              <CameraCapture
                onCapture={(file) => { addFiles([file]); }}
                onClose={closeCamera}
              />
            </div>
          )}
        </section>

        {/* Step 2: queue + extract */}
        {queue.length > 0 && (
          <section aria-labelledby="step-extract" className="mb-8 animate-fade-in">
            <SectionStep n={2} title="Review queue & extract" id="step-extract" />
            <Queue
              items={queue}
              onClearAll={clearQueue}
              onRemove={removeFromQueue}
              onClearDone={clearDoneQueue}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={runExtraction}
                disabled={running || pendingCount === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ScanText className="h-4 w-4" aria-hidden="true" />}
                {running ? "Extracting…" : `Extract ${pendingCount || ""}`.trim()}
              </button>
              {typeof remainingFree === "number" && !running && (
                <span className="text-xs text-muted-foreground">
                  {remainingFree} free scan{remainingFree === 1 ? "" : "s"} left
                </span>
              )}
              {running && (
                <div className="flex-1" aria-live="polite">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Processing {progress.done} of {progress.total}</span>
                    <span>{progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full max-w-xs overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Step 3: results + export */}
        {results.length > 0 && (
          <section aria-labelledby="step-results" className="animate-fade-in">
            <SectionStep n={3} title="Review & export" id="step-results" />
            {reviewCount > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-review/30 bg-review/5 px-3 py-2 text-sm text-review">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>{reviewCount} row{reviewCount === 1 ? "" : "s"} need human review. Flagged cells are highlighted.</span>
              </div>
            )}
            <PullToRefresh onRefresh={refreshResults}>
              <ResultsTable rows={results} onRemove={removeFromResults} />
            </PullToRefresh>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => downloadCsv(results)}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Sheet className="h-4 w-4" aria-hidden="true" />
                Download CSV
              </button>
              <button
                type="button"
                onClick={() => downloadXlsx(results)}
                className="inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border shadow-sm hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FileDown className="h-4 w-4 text-accent-ink" aria-hidden="true" />
                Download Excel
              </button>
              <button
                type="button"
                onClick={clearResults}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear results
              </button>
              <button
                type="button"
                onClick={startOver}
                className="ml-auto inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Start over
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Results stay saved in this browser until you clear them or start over.
            </p>
          </section>
        )}

      </main>

      <Footer />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-safe left-1/2 z-50 -translate-x-1/2 animate-fade-in-up"
        >
          <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-verified" aria-hidden="true" />
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-safe backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ScanText className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Invoice Extractor</span>
        </a>
        <a
          href="#tool"
          className="hidden items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
        >
          Open the tool <span aria-hidden="true">→</span>
        </a>
        <ThemeToggle />
        <ProfileMenu />
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
            <a
              href="#tool"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Start extracting <span aria-hidden="true">→</span>
            </a>
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
          <p className="mt-1.5 font-display text-lg font-semibold text-foreground">Maria Gonzalez</p>
          <p className="mt-0.5 text-sm text-muted-foreground">857 Cedar Lane · Loomis, CA</p>
          <p className="mt-0.5 font-mono text-sm text-foreground">(-) 257-9994</p>
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

function SectionStep({ n, title, id }) {
  return (
    <div className="mb-3 flex items-center gap-2.5" id={id}>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{n}</span>
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
    </div>
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