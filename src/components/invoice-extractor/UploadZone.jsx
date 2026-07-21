import { useCallback, useRef, useState } from "react";
import { Upload, X, FileWarning } from "lucide-react";

const ACCEPTED = {
  "image/jpeg": { ext: ["jpg", "jpeg"], max: 10 },
  "image/png": { ext: ["png"], max: 10 },
  "image/webp": { ext: ["webp"], max: 10 },
  "application/pdf": { ext: ["pdf"], max: 20 },
};

export function getFileKind(file) {
  const name = (file.name || "").toLowerCase();
  const byType = ACCEPTED[file.type];
  if (byType) return byType;
  for (const cfg of Object.values(ACCEPTED)) {
    if (cfg.ext.some((e) => name.endsWith("." + e))) return cfg;
  }
  return null;
}

export default function UploadZone({ onFiles, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState([]);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const ok = [];
      const bad = [];
      Array.from(fileList).forEach((file) => {
        const cfg = getFileKind(file);
        if (!cfg) {
          bad.push({ name: file.name, reason: "Unsupported file type" });
          return;
        }
        const sizeMb = file.size / (1024 * 1024);
        const cap = cfg.max;
        if (sizeMb > cap) {
          bad.push({ name: file.name, reason: `Exceeds ${cap} MB limit (images ${ACCEPTED["image/jpeg"].max} MB, PDF 20 MB)` });
          return;
        }
        ok.push(file);
      });
      setRejected(bad);
      if (ok.length) onFiles(ok);
    },
    [onFiles]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload invoices. Drag and drop or press Enter to browse."
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 ${
          dragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/60 hover:bg-secondary/40"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-accent ring-1 ring-border">
          <Upload className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-xl text-foreground">
            Drop invoices here, or <span className="text-accent underline-offset-4 group-hover:underline">browse</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Multiple files · JPG, PNG, WEBP up to 10 MB · PDF up to 20 MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {rejected.length > 0 && (
        <div role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <FileWarning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <ul className="space-y-1">
              {rejected.map((r, i) => (
                <li key={i}>
                  <span className="font-medium">{r.name}</span> — {r.reason}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setRejected([])}
              className="ml-auto rounded p-1 text-destructive hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dismiss rejection notices"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}