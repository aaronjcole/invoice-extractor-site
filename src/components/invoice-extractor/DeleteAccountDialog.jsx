import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";

const CONFIRM_WORD = "DELETE";

export default function DeleteAccountDialog({ open, onOpenChange }) {
  const { user, logout } = useAuth();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = confirm.trim().toUpperCase() === CONFIRM_WORD && !busy;

  const reset = () => {
    setConfirm("");
    setError(null);
    setBusy(false);
  };

  const handleOpenChange = (next) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleDelete = async () => {
    setError(null);
    setBusy(true);
    try {
      await base44.functions.invoke("delete-account", {});
      // Account is gone — clear the local session and return to the login screen.
      logout(false);
      window.location.href = "/login";
    } catch (e) {
      setBusy(false);
      setError(
        e?.response?.data?.error ||
          e?.message ||
          "Failed to delete account. Please try again or contact support."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            Delete account
          </DialogTitle>
          <DialogDescription>
            This permanently deletes your account and signs you out. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user?.email}</span>.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="delete-confirm">
              Type <span className="font-semibold text-destructive">{CONFIRM_WORD}</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              autoComplete="off"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!canSubmit}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Delete account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}