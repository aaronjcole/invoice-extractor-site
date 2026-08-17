import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, ScanText, XCircle } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("confirming"); // confirming | success | error

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    base44.functions
      .invoke("confirm", { session_id: sessionId })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [sessionId]);

  return (
    <div className="min-h-screen paper-grain flex flex-col">
      <header className="border-b border-border bg-background/85 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ScanText className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">Invoice Extractor</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          {status === "confirming" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent-ink" aria-hidden="true" />
              <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">Activating your access…</h1>
              <p className="mt-2 text-muted-foreground">Just a moment while we confirm your payment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-verified" aria-hidden="true" />
              <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">You're all set!</h1>
              <p className="mt-2 text-muted-foreground">
                Your access is now active. Start extracting as many invoices as you need.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Start extracting →
                </Link>
                <Link
                  to="/"
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  Back to home
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" aria-hidden="true" />
              <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">Something went wrong</h1>
              <p className="mt-2 text-muted-foreground">
                We couldn't confirm your payment. If you were charged, your access will activate shortly — try
                refreshing this page or opening the app.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Open app anyway →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("confirming");
                    base44.functions
                      .invoke("confirm", { session_id: sessionId })
                      .then(() => setStatus("success"))
                      .catch(() => setStatus("error"));
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  Retry confirmation
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
