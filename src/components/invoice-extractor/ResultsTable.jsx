import { useState } from "react";
import { needsReview } from "@/lib/exporters";
import { FIELD_LABELS } from "@/lib/extractionPrompt";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShieldCheck, ShieldAlert, HelpCircle, Ban, ChevronDown, ScanText } from "lucide-react";

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

// Fields shown in the expanded mobile details (display_name is the card title).
const DETAIL_FIELDS = ["phone", "email", "street_address", "city", "state", "zip_code"];

export default function ResultsTable({ rows, onRemove }) {
  const isMobile = useIsMobile();
  if (!rows.length) return null;
  if (isMobile) return <MobileResults rows={rows} onRemove={onRemove} />;

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

// Mobile: each result renders as a stacked, expandable card. The summary shows
// the name plus confidence and review status; expanding reveals every field,
// the address-check badge, the filename, and a remove action.
function MobileResults({ rows, onRemove }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const review = needsReview(row);
        const verifySet = new Set(row.fields_to_verify || []);
        const expanded = openId === row.id;
        const name = row.display_name || row.filename || "Untitled";
        return (
          <div
            key={row.id}
            className={`rounded-2xl border bg-card shadow-sm ${review ? "border-review/30" : "border-border"}`}
          >
            <button
              type="button"
              onClick={() => setOpenId(expanded ? null : row.id)}
              aria-expanded={expanded}
              aria-controls={`row-${row.id}-details`}
              className="flex w-full items-center gap-3 rounded-2xl p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-ink">
                <ScanText className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-semibold text-foreground">{name}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <ConfBadge value={row.confidence} />
                  {review ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-review/15 px-2 py-0.5 text-[11px] font-semibold text-review ring-1 ring-inset ring-review/30">
                      <ShieldAlert className="h-3 w-3" aria-hidden="true" /> Review
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-verified/10 px-2 py-0.5 text-[11px] font-medium text-verified">
                      <ShieldCheck className="h-3 w-3" aria-hidden="true" /> OK
                    </span>
                  )}
                </span>
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {expanded && (
              <div id={`row-${row.id}-details`} className="border-t border-border px-4 py-3">
                <dl className="space-y-2">
                  {DETAIL_FIELDS.map((h) => {
                    const flagged = verifySet.has(h);
                    const val = row[h];
                    return (
                      <div key={h} className="flex items-start justify-between gap-3">
                        <dt className="text-xs text-muted-foreground">{FIELD_LABELS[h]}</dt>
                        <dd
                          className={`text-right text-sm ${
                            flagged
                              ? "rounded bg-review/15 px-1.5 py-0.5 font-medium text-foreground ring-1 ring-inset ring-review/30"
                              : "text-foreground"
                          }`}
                        >
                          {val != null && val !== "" ? val : <span className="text-muted-foreground/40">—</span>}
                        </dd>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Address check</dt>
                    <dd><AddressBadge status={row.addressCheck} /></dd>
                  </div>
                </dl>
                <p className="mt-3 truncate text-xs text-muted-foreground" title={row.filename}>{row.filename}</p>
                <button
                  type="button"
                  onClick={() => onRemove(row.id)}
                  className="mt-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Remove ${row.filename} from results`}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );
      })}
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