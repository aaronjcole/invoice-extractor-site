import { base44 } from "@/api/base44Client";
import { EXTRACTION_PROMPT, RESPONSE_SCHEMA, CONTACT_FIELDS } from "./extractionPrompt";

// Vision-capable Claude. Non-default model (uses more credits) — required for
// reliable typed/handwritten invoice reading per product spec.
const VISION_MODEL = "claude_sonnet_4_6";

/**
 * Extract JSON from an LLM response that may be a parsed object, a JSON string,
 * or a string wrapped in markdown code fences. This is the reliability seam.
 */
export function parseExtractionResult(raw) {
  if (raw == null) throw new Error("Empty response from model.");

  // Already parsed to an object (platform returns dict when schema provided).
  if (typeof raw === "object") return raw;

  if (typeof raw !== "string") throw new Error("Unexpected response type.");

  let text = raw.trim();

  // Strip markdown code fences if present.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  // Try direct parse.
  try {
    return JSON.parse(text);
  } catch {
    // Fall back to outermost {...} block.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("Could not locate JSON object in response.");
  }
}

/**
 * Validate the parsed object against the output contract.
 * Throws on missing required keys or invalid confidence.
 */
export function validateExtraction(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Result is not an object.");
  const missing = [];
  for (const k of [...CONTACT_FIELDS, "confidence", "fields_to_verify"]) {
    if (!(k in obj)) missing.push(k);
  }
  if (missing.length) throw new Error(`Missing keys: ${missing.join(", ")}`);
  if (!["high", "medium", "low"].includes(obj.confidence)) {
    throw new Error("confidence must be high, medium, or low.");
  }
  if (!Array.isArray(obj.fields_to_verify)) {
    throw new Error("fields_to_verify must be an array.");
  }
  // Coerce nulls and strings.
  for (const k of CONTACT_FIELDS) {
    if (obj[k] !== null && typeof obj[k] !== "string") {
      obj[k] = obj[k] == null ? null : String(obj[k]);
    }
  }
  return obj;
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