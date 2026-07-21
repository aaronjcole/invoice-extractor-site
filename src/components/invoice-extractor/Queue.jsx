import { FileText, Image as ImageIcon, Trash2, Loader2, Check, AlertTriangle, Clock } from "lucide-react";

const STATUS = {
  pending: { label: "Pending", icon: Clock, cls: "text-muted-foreground bg-secondary" },
  running: { label: "Processing", icon: Loader2, cls: "text-accent-ink bg-accent/10", spin: true },
  done: { label: "Done", icon: Check, cls: "text-verified bg-verified/10" },
  error: { label: "Error", icon: AlertTriangle, cls: "text-destructive bg-destructive/10" },
};

function isPdf(file) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function fmtSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

export default function Queue({ items, onClearAll, onRemove, onClearDone }) {
  if (!items.length) return null;
  const hasDone = items.some((i) => i.status === "done" || i.status === "error");

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg text-foreground">
          Queue <span className="text-sm font-body font-normal text-muted-foreground">({items.length})</span>
        </h2>
        <div className="flex gap-2">
          {hasDone && (
            <button
              type="button"
              onClick={onClearDone}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear finished
            </button>
          )}
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Clear all
          </button>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {items.map((item) => {
          const st = STATUS[item.status] || STATUS.pending;
          const Icon = isPdf(item.file) ? FileText : ImageIcon;
          const StatusIcon = st.icon;
          return (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">{fmtSize(item.file.size)}{item.enhanced ? " · enhanced" : ""}</p>
                {item.error && (
                  <p role="alert" className="mt-0.5 text-xs text-destructive">{item.error}</p>
                )}
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>
                <StatusIcon className={`h-3.5 w-3.5 ${st.spin ? "animate-spin" : ""}`} aria-hidden="true" />
                {st.label}
              </span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Remove ${item.file.name} from queue`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}