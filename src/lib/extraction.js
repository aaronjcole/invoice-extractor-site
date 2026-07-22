import { base44 } from "@/api/base44Client";
import { EXTRACTION_PROMPT, RESPONSE_SCHEMA, CONTACT_FIELDS } from "./extractionPrompt";

// Vision-capable Claude. Non-default model (uses more credits) — required for
// reliable typed/handwritten invoice reading per product spec.
const VISION_MODEL = "gemini_3_flash";

function looksLikeResult(o) {
  return (
    o && typeof o === "object" && !Array.isArray(o) &&
    ("confidence" in o || "display_name" in o || "fields_to_verify" in o)
  );
}

// Unwrap envelopes / nesting: find the first object that looks like the extraction result.
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

export function parseExtractionResult(raw) {
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

export function validateExtraction(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Result is not an object.");
  const out = {};
  for (const k of CONTACT_FIELDS) {
    out[k] = obj[k] == null ? null : (typeof obj[k] === "string" ? obj[k] : String(obj[k]));
  }
  // Lenient on the universal-key path: default to "low" (which flags the row for review)
  // rather than throwing, so a slightly-off response still yields a usable row.
  out.confidence = ["high", "medium", "low"].includes(obj.confidence) ? obj.confidence : "low";
  out.fields_to_verify = Array.isArray(obj.fields_to_verify)
    ? obj.fields_to_verify.filter((f) => typeof f === "string")
    : [];
  return out;
}

/**
 * Run extraction for a single uploaded file URL. Retries once on parse/validation
 * failure with a stricter instruction, then throws a clear error.
 */
export async function extractFromFile(fileUrl, { filename = "invoice" } = {}) {
  const baseCall = (extra) =>
    base44.integrations.Core.InvokeLLM({
      prompt: EXTRACTION_PROMPT,
      response_json_schema: RESPONSE_SCHEMA,
      file_urls: [fileUrl],
      model: VISION_MODEL,
      ...(extra ? { prompt: `${EXTRACTION_PROMPT}\n\nREMINDER: Output ONLY the raw JSON object. No markdown, no explanation.` } : {}),
    });

  let attempt = 0;
  let lastErr = null;
  while (attempt < 2) {
    attempt += 1;
    let res;
    try {
      // InvokeLLM returns an object when response_json_schema is set, but the
      // universal-key path may not guarantee schema-strict output, so we parse defensively.
      res = await baseCall(attempt === 2);
    } catch (e) {
      throw new Error(`Extraction request failed: ${e.message || e}`);
    }
    try {
      const parsed = parseExtractionResult(res);
      return validateExtraction(parsed);
    } catch (e) {
      lastErr = e;
      // retry once
    }
  }
  throw new Error(lastErr?.message || "Failed to parse extraction result after retry.");
}