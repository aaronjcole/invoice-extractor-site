import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  ScanText, FileDown, Sheet, RotateCcw, Camera, Sparkles, ShieldCheck,
  MapPin, Loader2, Trash2, CheckCircle2,
} from "lucide-react";
import UploadZone from "@/components/invoice-extractor/UploadZone";
import Queue from "@/components/invoice-extractor/Queue";
import ResultsTable from "@/components/invoice-extractor/ResultsTable";
import CameraCapture from "@/components/invoice-extractor/CameraCapture";
import { enhanceImage } from "@/lib/imageEnhance";
import { extractFromFile } from "@/lib/extraction";
import { verifyAddress, resetVerifier } from "@/lib/addressVerify";
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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [toast, setToast] = useState(null);

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

  const pendingCount = useMemo(() => queue.filter((i) => i.status === "pending").length, [queue]);
  const reviewCount = useMemo(() => results.filter(needsReview).length, [results]);

  const updateQueueItem = (id, patch) =>
    setQueue((q) => q.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const runExtraction = async () => {
    const pending = queue.filter((i) => i.status === "pending");
    if (!pending.length) return;
    setRunning(true);
    resetVerifier();
    setProgress({ done: 0, total: pending.length });
    let done = 0;

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

        // 3. Vision LLM extraction (server-side, universal key).
        const extracted = await extractFromFile(file_url, { filename: item.file.name });

        // 4. Optional address verification.
        const addressCheck = await verifyAddress(extracted);

        const row = {
          id: item.id,
          filename: item.file.name,
          ...extracted,
          addressCheck,
        };
        setResults((r) => [row, ...r]);
        updateQueueItem(item.id, { status: "done", enhanced });
      } catch (e) {
        updateQueueItem(item.id, { status: "error", error: e.message || "Extraction failed" });
      }
      done += 1;
      setProgress({ done, total: pending.length });
    }

    setRunning(false);
    showToast("Extraction complete", "success");
  };

  const startOver = () => {
    setQueue([]);
    clearResults();
  };

  return (
    <div className="min-h-screen paper-grain">
      <Header />
      <Hero />

      <main id="tool" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24">
        {/* Step 1: add files */}
        <section aria-labelledby="step-add" className="mb-8">
          <SectionStep n={1} title="Add invoices" id="step-add" />
          <UploadZone onFiles={addFiles} disabled={running} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCameraOpen((v) => !v)}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Camera className="h-4 w-4 text-accent" aria-hidden="true" />
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
                onClose={() => setCameraOpen(false)}
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
            <ResultsTable rows={results} onRemove={removeFromResults} />
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
                <FileDown className="h-4 w-4 text-accent" aria-hidden="true" />
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

        {results.length === 0 && queue.length === 0 && <EmptyHint />}
      </main>

      <Footer />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in-up"
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
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ScanText className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Invoice Extractor</span>
        </a>
        <nav className="flex items-center gap-1 text-sm">
          <a href="#tool" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">Tool</a>
          <a href="#how" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">How it works</a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border/70">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Vision-AI · typed or handwritten · no API key needed
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-6xl">
            Pull customer contacts out of invoices — automatically.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground text-balance">
            Drop in invoice images or PDFs. A vision model reads the customer's name, phone, email and address,
            flags anything uncertain for review, verifies addresses, and exports clean CSV & Excel.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#tool"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ScanText className="h-4 w-4" aria-hidden="true" />
              Start extracting
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              How it works
            </a>
          </div>
          <FeatureRow />
        </div>
      </div>
    </section>
  );
}

function FeatureRow() {
  const items = [
    { icon: ScanText, text: "Reads typed & handwritten invoices" },
    { icon: ShieldCheck, text: "Flags uncertain fields for review" },
    { icon: MapPin, text: "Address verification built in" },
    { icon: Sheet, text: "CSV & Excel exports, Excel-ready" },
  ];
  return (
    <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <li key={it.text} className="flex items-center gap-2 text-sm text-muted-foreground">
          <it.icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span>{it.text}</span>
        </li>
      ))}
    </ul>
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

function EmptyHint() {
  return (
    <section id="how" className="mt-4 scroll-mt-20">
      <h2 className="font-display text-2xl font-semibold text-foreground">How it works</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { n: "1", t: "Add your invoices", d: "Drag in multiple JPG, PNG, WEBP or PDF files — or snap a photo right here in the browser." },
          { n: "2", t: "AI reads each one", d: "A vision model extracts the customer's contact details from every page and scores its confidence." },
          { n: "3", t: "Review & export", d: "Uncertain fields are highlighted. Verify addresses, then download a clean CSV or Excel file." },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="font-display text-3xl text-accent/80">{s.n}</span>
            <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{s.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/70 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        <p>Invoice Extractor — customer contacts from invoices, extracted with vision AI.</p>
        <p className="mt-1 text-xs">Results are stored only in your browser until you export them. No invoice data is retained on a server.</p>
      </div>
    </footer>
  );
}