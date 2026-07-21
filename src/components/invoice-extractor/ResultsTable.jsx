import { needsReview } from "@/lib/exporters";
import { FIELD_LABELS } from "@/lib/extractionPrompt";
import { ShieldCheck, ShieldAlert, HelpCircle, Ban } from "lucide-react";

const CONF = {
  high: { label: "High", cls: "bg-verified/15 text-verified ring-verified/30" },
  medium: { label: "Medium", cls: "bg-review/15 text-review ring-review/30" },
  low: { label: "Low", cls: "bg-destructive/15 text-destructive ring-destructive/30" },
};

const ADDR = {
  verified: { label: "Verified", icon: ShieldCheck, cls: "text-verified" },
  check: { label: "Check", icon: ShieldAlert, cls: "text-review" },
  "not checked": { label: "Not checked", icon: HelpCircle, cls: "text-muted-foreground" },
  "": { label: "—", icon: Ban, cls: "text-muted-foreground" },
};

const HEADERS = [
  "display_name", "phone", "email", "street_address", "city", "state", "zip_code",
  "addressCheck", "confidence",
];

export default function ResultsTable({ rows, onRemove }) {
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm scrollbar-thin">
      <table className="w-full min-w-[920px] border-collapse text-sm">
        <caption className="sr-only">
          Extracted customer contacts. Rows flagged "needs review" require human verification.
        </caption>
        <thead>
          <tr className="bg-secondary/60 text-left">
            <th scope="col" className="px-3 py-2.5 font-semibold text-foreground">File</th>
            {HEADERS.filter((h) => h !== "addressCheck" && h !== "confidence").map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 font-semibold text-foreground">
                {FIELD_LABELS[h]}
              </th>
            ))}
            <th scope="col" className="px-3 py-2.5 font-semibold text-foreground">Address Check</th>
            <th scope="col" className="px-3 py-2.5 font-semibold text-foreground">Confidence</th>
            <th scope="col" className="px-3 py-2.5 font-semibold text-foreground">Review</th>
            <th scope="col" className="px-3 py-2.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const review = needsReview(row);
            const verifySet = new Set(row.fields_to_verify || []);
            return (
              <tr
                key={row.id}
                className={`border-t border-border ${review ? "bg-review/5" : ""}`}
              >
                <td className="max-w-[160px] truncate px-3 py-2.5 text-xs text-muted-foreground" title={row.filename}>
                  {row.filename}
                </td>
                {HEADERS.map((h) => {
                  if (h === "addressCheck" || h === "confidence") return null;
                  const flagged = verifySet.has(h);
                  return (
                    <td
                      key={h}
                      className={`px-3 py-2.5 ${flagged ? "bg-review/15 ring-1 ring-inset ring-review/30" : ""}`}
                    >
                      {row[h] != null && row[h] !== "" ? (
                        <span className={flagged ? "font-medium text-foreground" : "text-foreground"}>{row[h]}</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5">
                  <AddressBadge status={row.addressCheck} />
                </td>
                <td className="px-3 py-2.5">
                  <ConfBadge value={row.confidence} />
                </td>
                <td className="px-3 py-2.5">
                  {review ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-review/15 px-2.5 py-1 text-xs font-semibold text-review ring-1 ring-inset ring-review/30">
                      <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                      Needs review
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-verified/10 px-2.5 py-1 text-xs font-medium text-verified">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      OK
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Remove ${row.filename} from results`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConfBadge({ value }) {
  const c = CONF[value] || CONF.low;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${c.cls}`}>
      {c.label}
    </span>
  );
}

function AddressBadge({ status }) {
  const a = ADDR[status] || ADDR[""];
  const Icon = a.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${a.cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {a.label}
    </span>
  );
}