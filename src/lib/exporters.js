import * as XLSX from "xlsx";
import { FIELD_LABELS, verifyLabels } from "./extractionPrompt";

// Row needs review — single source of truth used by the table AND both exports.
// Needs review if: fields_to_verify non-empty, OR confidence != high, OR address
// was checked AND failed. An unchecked address does NOT by itself trigger review.
export function needsReview(row) {
  const hasVerify = Array.isArray(row.fields_to_verify) && row.fields_to_verify.length > 0;
  const confNotHigh = row.confidence !== "high";
  const addrFailed = row.addressCheck === "check";
  return hasVerify || confNotHigh || addrFailed;
}

function toRow(row, index) {
  return {
    [FIELD_LABELS.display_name]: row.display_name ?? "",
    [FIELD_LABELS.phone]: row.phone ?? "",
    [FIELD_LABELS.email]: row.email ?? "",
    [FIELD_LABELS.street_address]: row.street_address ?? "",
    [FIELD_LABELS.city]: row.city ?? "",
    [FIELD_LABELS.state]: row.state ?? "",
    [FIELD_LABELS.zip_code]: row.zip_code ?? "",
    [FIELD_LABELS.confidence]: row.confidence ?? "",
    [FIELD_LABELS.fields_to_verify]: verifyLabels(row.fields_to_verify),
    [FIELD_LABELS.review]: needsReview(row) ? "Needs Review" : "OK",
    __filename: row.filename ?? `invoice_${index + 1}`,
  };
}

function exportColumns() {
  return [
    FIELD_LABELS.display_name,
    FIELD_LABELS.phone,
    FIELD_LABELS.email,
    FIELD_LABELS.street_address,
    FIELD_LABELS.city,
    FIELD_LABELS.state,
    FIELD_LABELS.zip_code,
    FIELD_LABELS.confidence,
    FIELD_LABELS.fields_to_verify,
    FIELD_LABELS.review,
  ];
}

// RFC-4180 quoting with a UTF-8 BOM so Excel reads accented characters.
export function buildCsv(rows) {
  const cols = exportColumns();
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [cols.join(",")];
  rows.forEach((r, i) => {
    const data = toRow(r, i);
    lines.push(cols.map((c) => escape(data[c])).join(","));
  });
  return "\uFEFF" + lines.join("\r\n");
}

export function downloadCsv(rows, filename = "invoice-contacts.csv") {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function downloadXlsx(rows, filename = "invoice-contacts.xlsx") {
  const cols = exportColumns();
  const aoa = [cols];
  rows.forEach((r, i) => {
    const data = toRow(r, i);
    aoa.push(cols.map((c) => data[c]));
  });
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Reasonable column widths.
  ws["!cols"] = [
    { wch: 22 }, { wch: 18 }, { wch: 26 }, { wch: 28 }, { wch: 16 },
    { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contacts");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}