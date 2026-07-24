import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Extraction prompt + schema copied verbatim from src/lib/extractionPrompt.js so the
// server-side output contract matches the previous client-side behavior exactly.
const EXTRACTION_PROMPT = `You are an expert data-entry assistant that extracts CUSTOMER contact details from invoice images and PDFs (typed or handwritten). Read EVERY page of the document. Return ONLY a single JSON object matching the provided schema — no prose, no markdown, no code fences.

WHICH PARTY TO EXTRACT — CUSTOMER vs. BILLER
- Extract the CUSTOMER's (buyer's / recipient's / "Bill To" / "Ship To") contact details, NOT the biller/vendor/seller's own details.
- Phone & email are often the BILLER's. Only set phone/email when they clearly belong to the CUSTOMER. If a phone or email is the biller's and the customer has none, set those fields to null.
- "display_name" = the customer's name (person or company). The customer block is usually labeled "Bill To", "Customer", "Client", "Sold To", or "Ship To".

FIELD RULES
- display_name: customer name exactly as printed. null if absent.
- phone: Use these rules:
  • A bare 7-digit local number (e.g. 257-9994) means NO area code is known. Format it as "(-) 257-9994" — do NOT invent an area code from the first three digits.
  • A 10-digit US number: format as "(XXX) XXX-XXXX".
  • An 11-digit number starting with country code 1: drop the leading 1 and format as a 10-digit number "(XXX) XXX-XXXX". For other country codes, keep the country code, e.g. "+44 20 7946 0958".
  • Preserve extensions as " ext. N".
  • null if the number belongs to the biller or is absent.
- email: lowercased customer email. null if it belongs to the biller or is absent.
- street_address: the customer's street line. Include PO Boxes as "PO Box 1234". Include suite/unit/apt/# as "123 Main St, Ste 200". For international addresses, keep the street line as written; put city/state/zip in their fields. null if absent.
- city: expand common abbreviations — "St." -> "Saint", "Ft." -> "Fort", "Mt." -> "Mount". Otherwise as written. null if absent.
- state: 2-letter US state code if US (e.g. "CA"); otherwise full region/province as written. null if absent.
- zip_code: US ZIP as 5 digits, or ZIP+4 as "12345-6789". For non-US, postal code as written. null if absent.
- notes: short free-text note ONLY for genuine ambiguity (e.g. "customer vs biller unclear; used Bill To block"). null if none.

SAME-ADDRESS TIE-BREAK
- If "Bill To" and "Ship To" differ and both clearly belong to the customer, prefer the "Bill To" address.

CONFIDENCE RUBRIC (strict)
- "high": all 7 contact fields are clearly legible and unambiguously the customer's (or legitimately null because genuinely absent).
- "medium": most fields clear but at least one field is slightly ambiguous or hard to read.
- "low": multiple fields uncertain, illegible, or customer-vs-biller disambiguation is unreliable.
- Never default to "high" to be polite. A genuinely handwritten, faded, or ambiguous invoice is "medium" or "low".

fields_to_verify
- Array of field names (from: display_name, phone, email, street_address, city, state, zip_code, notes) that a human should double-check. Include any field you are not confident about, any field where customer-vs-biller attribution is uncertain, and any field that was hard to read. Empty array only if everything is genuinely solid.

OUTPUT
- Return ONLY the JSON object. Every required key must be present. Use null for absent contact fields and for notes. confidence must be one of high|medium|low. fields_to_verify must be an array (possibly empty).`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    display_name: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    street_address: { type: ["string", "null"] },
    city: { type: ["string", "null"] },
    state: { type: ["string", "null"] },
    zip_code: { type: ["string", "null"] },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    notes: { type: ["string", "null"] },
    fields_to_verify: { type: "array", items: { type: "string" } },
  },
  required: [
    "display_name",
    "phone",
    "email",
    "street_address",
    "city",
    "state",
    "zip_code",
    "confidence",
    "notes",
    "fields_to_verify",
  ],
};

const CONTACT_FIELDS = [
  "display_name",
  "phone",
  "email",
  "street_address",
  "city",
  "state",
  "zip_code",
  "notes",
];

const VISION_MODEL = "gemini_3_flash";
const FREE_LIMIT = 3;

// --- Defensive parsing/validation (copied from src/lib/extraction.js) ---

function looksLikeResult(o) {
  return (
    o && typeof o === "object" && !Array.isArray(o) &&
    ("confidence" in o || "display_name" in o || "fields_to_verify" in o)
  );
}

function findResultObject(node, depth = 0) {
  if (looksLikeResult(node)) return node;
  if (node && typeof node === "object" && depth < 4) {
    for (const v of Object.values(node)) {
      const found = findResultObject(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function parseExtractionResult(raw) {
  if (raw == null) throw new Error("Empty response from model.");
  let candidate = raw;
  if (typeof raw === "string") {
    let text = raw.trim();
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) text = fence[1].trim();
    try {
      candidate = JSON.parse(text);
    } catch {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        candidate = JSON.parse(text.slice(start, end + 1));
      } else {
        throw new Error("Could not locate JSON object in response.");
      }
    }
  }
  const found = findResultObject(candidate);
  if (!found) {
    const snippet = (typeof raw === "string" ? raw : JSON.stringify(raw)).slice(0, 240);
    throw new Error(`Unrecognized response shape: ${snippet}`);
  }
  return found;
}

function validateExtraction(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Result is not an object.");
  const out = {};
  for (const k of CONTACT_FIELDS) {
    out[k] = obj[k] == null ? null : (typeof obj[k] === "string" ? obj[k] : String(obj[k]));
  }
  out.confidence = ["high", "medium", "low"].includes(obj.confidence) ? obj.confidence : "low";
  out.fields_to_verify = Array.isArray(obj.fields_to_verify)
    ? obj.fields_to_verify.filter((f) => typeof f === "string")
    : [];
  return out;
}

// --- Server-side address verification (US Census geocoder, no key, no CORS) ---

function isLikelyUS(extracted) {
  const state = (extracted.state || "").trim().toUpperCase();
  const zip = (extracted.zip_code || "").trim();
  return /^[A-Z]{2}$/.test(state) || /^\d{5}(-\d{4})?$/.test(zip);
}

async function censusMatch(extracted) {
  const params = new URLSearchParams({ benchmark: "Public_AR_Current", format: "json" });
  if (extracted.street_address) params.set("street", extracted.street_address);
  if (extracted.city) params.set("city", extracted.city);
  if (extracted.state) params.set("state", extracted.state);
  if (extracted.zip_code) params.set("zip", extracted.zip_code);
  const url = `https://geocoding.geo.census.gov/geocoder/locations/address?${params.toString()}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`geocoder ${res.status}`);
    const json = await res.json();
    const matches = json && json.result && json.result.addressMatches;
    return Array.isArray(matches) && matches.length > 0;
  } finally {
    clearTimeout(t);
  }
}

async function verifyAddress(extracted) {
  const hasAddress =
    extracted.street_address || extracted.city || extracted.state || extracted.zip_code;
  if (!hasAddress) return "";
  if (!isLikelyUS(extracted)) return "not checked";
  const provider = (Deno.env.get("ADDRESS_PROVIDER") || "census").toLowerCase();
  if (provider === "none") return "not checked";
  try {
    const matched = await censusMatch(extracted);
    if (matched && extracted.confidence === "high") return "verified";
    return "check";
  } catch {
    return "not checked";
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "auth_required" }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const file_url = body && body.file_url;
    const file_name = (body && body.file_name) || "scan";
    if (!file_url) return Response.json({ error: "file_url is required" }, { status: 400 });

    // COST-CAP BACKSTOP: total scans today across ALL users (service role bypasses RLS).
    const cap = Number(Deno.env.get("GLOBAL_DAILY_SCAN_CAP") || 500);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayIso = startOfDay.toISOString();
    const todayScans = await base44.asServiceRole.entities.ScanLog.filter(
      { created_date: { $gte: todayIso } },
      "-created_date",
      1000
    );
    if (todayScans.length >= cap) {
      return Response.json({ error: "capacity" }, { status: 503 });
    }

    // ENTITLEMENT CHECK: any lifetime, or an unexpired day_pass.
    const entitlements = await base44.entities.Entitlement.filter(
      { created_by_id: user.id },
      "-created_date",
      100
    );
    const now = Date.now();
    const entitled = entitlements.some((e) => {
      if (e.type === "lifetime") return true;
      if (e.type === "day_pass" && e.expires_at) {
        return new Date(e.expires_at).getTime() > now;
      }
      return false;
    });

    let usedCount = 0;
    if (!entitled) {
      const logs = await base44.entities.ScanLog.filter(
        { created_by_id: user.id },
        "-created_date",
        1000
      );
      usedCount = logs.length;
      if (usedCount >= FREE_LIMIT) {
        return Response.json({ error: "payment_required" }, { status: 402 });
      }
    }

    // EXTRACT via vision LLM (defensive parse + validate).
    let result;
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: EXTRACTION_PROMPT,
        response_json_schema: RESPONSE_SCHEMA,
        file_urls: [file_url],
        model: VISION_MODEL,
      });
      result = validateExtraction(parseExtractionResult(res));
    } catch (e) {
      return Response.json({ error: e.message || "Extraction failed" }, { status: 502 });
    }

    // GEOCODE server-side.
    const address_status = await verifyAddress(result);

    // Record this scan (user-scoped create; RLS stamps the owner).
    await base44.entities.ScanLog.create({ file_name });

    const remaining_free = entitled ? null : Math.max(0, FREE_LIMIT - (usedCount + 1));
    return Response.json({ result, address_status, remaining_free });
  } catch (error) {
    return Response.json({ error: error.message || "Server error" }, { status: 500 });
  }
});