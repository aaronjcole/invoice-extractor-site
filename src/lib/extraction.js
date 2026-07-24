import { base44 } from "@/api/base44Client";

// Typed extraction error. `type` lets the UI branch on auth / paywall / capacity.
export class ExtractionError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type; // "auth_required" | "payment_required" | "capacity" | "error"
    this.name = "ExtractionError";
  }
}

function statusToType(status) {
  if (status === 401) return "auth_required";
  if (status === 402) return "payment_required";
  if (status === 503) return "capacity";
  return "error";
}

/**
 * Run extraction via the server-side `extract` backend function, which enforces
 * sign-in, the 3-scan free limit, the global cost cap, and address verification.
 * Returns { result, address_status, remaining_free }.
 */
export async function extractFromFile(file_url, { filename: file_name } = {}) {
  let res;
  try {
    res = await base44.functions.invoke("extract", { file_url, file_name });
  } catch (e) {
    const status = e?.response?.status || e?.status;
    const data = e?.response?.data;
    const type = statusToType(status);
    const message = (data && data.error) || e?.message || "Extraction request failed.";
    throw new ExtractionError(type, message);
  }
  const data = res.data;
  if (!data) throw new ExtractionError("error", "Empty response from server.");
  return {
    result: data.result,
    address_status: data.address_status,
    remaining_free: data.remaining_free,
  };
}