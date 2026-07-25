import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ScanText, FileDown, Sheet, RotateCcw, Camera, Loader2, Trash2, CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import UploadZone from "@/components/invoice-extractor/UploadZone";
import Queue from "@/components/invoice-extractor/Queue";
import ResultsTable from "@/components/invoice-extractor/ResultsTable";
import CameraCapture from "@/components/invoice-extractor/CameraCapture";
import ProfileMenu from "@/components/invoice-extractor/ProfileMenu";
import PaywallModal from "@/components/invoice-extractor/PaywallModal";
import ThemeToggle from "@/components/ThemeToggle";
import PullToRefresh from "@/components/invoice-extractor/PullToRefresh";
import { enhanceImage } from "@/lib/imageEnhance";
import { extractFromFile } from "@/lib/extraction";
import { needsReview, downloadCsv, downloadXlsx } from "@/lib/exporters";
import { saveQueue, loadQueue } from "@/lib/queueStorage";

const STORAGE_KEY = "invoice-extractor:results";

let uid = 0;
const nextId = () => `f${Date.now()}_${uid++}`;

export default function Extractor() {
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
  const [paywallOpen, setPaywallOpen] = useState(false);

  // Living spreadsheet — persists until download/clear.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setResults(JSON.parse(saved));
    } catch {}
  }, []);

  // Restore any queued uploads saved before a page refresh.
  const hydratedRef = useRef(false);
  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await loadQueue();
      if (active && saved.length) {
        setQueue(
          saved.map((it) => ({
            id: it.id,
            file: it.file,
            status: "pending",
            enhanced: !!it.enhanced,
            error: null,
          }))
        );
      }
      hydratedRef.current = true;
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    saveQueue(queue);
  }, [queue]);
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
          setPaywallOpen(true);
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
      <ExtractorHeader />
      <main id="tool" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-28 pt-8 md:pb-24">
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
                <>
                  <span className="text-xs text-muted-foreground">
                    {remainingFree} free scan{remainingFree === 1 ? "" : "s"} left
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaywallOpen(true)}
                    className="text-xs font-medium text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Upgrade
                  </button>
                </>
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

      {paywallOpen && (
        <PaywallModal
          onClose={() => setPaywallOpen(false)}
          headline="You've used your 3 free scans"
        />
      )}
    </div>
  );
}

function ExtractorHeader() {
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
          <ProfileMenu />
        </div>
      </div>
    </header>
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