import { ScanText, X } from "lucide-react";

export default function SignInModal({ onSignIn, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-xl"
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
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ScanText className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 id="signin-title" className="mt-5 font-display text-2xl font-semibold text-foreground">
          Sign in to use Invoice Extractor
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need an account to extract contacts and manage your scans.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}