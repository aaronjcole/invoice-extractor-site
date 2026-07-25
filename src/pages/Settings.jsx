import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2, User, Moon } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileMenu from "@/components/invoice-extractor/ProfileMenu";
import DeleteAccountDialog from "@/components/invoice-extractor/DeleteAccountDialog";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [delOpen, setDelOpen] = useState(false);

  // Return users to where they came from (e.g. /app); fall back to the
  // workspace if there's no history to go back to.
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(user ? "/app" : "/");
  };

  return (
    <div className="min-h-screen paper-grain">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="font-display text-xl font-semibold">Settings</h1>
          <div className="ml-auto">
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
        {/* Appearance */}
        <section className="mb-6">
          <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Appearance</h2>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent-ink">
                <Moon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Dark mode</p>
                <p className="text-xs text-muted-foreground">Match system or toggle manually.</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Account</h2>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <User className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.email || "Not signed in"}
                </p>
                <p className="text-xs text-muted-foreground">{user?.full_name || "Anonymous user"}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setDelOpen(true)}
                disabled={!user}
                className="mt-3 inline-flex select-none items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete account
              </button>
            </div>
          </div>
        </section>
      </main>

      <DeleteAccountDialog open={delOpen} onOpenChange={setDelOpen} />
    </div>
  );
}