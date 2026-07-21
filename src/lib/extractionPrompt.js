// The extraction prompt sent alongside every invoice image/PDF.
// Kept intact — exports and downstream logic depend on the output contract.

export const EXTRACTION_PROMPT = `You are an expert data-entry assistant that extracts CUSTOMER contact details from invoice images and PDFs (typed or handwritten). Read EVERY page of the document. Return ONLY a single JSON object matching the provided schema — no prose, no markdown, no code fences.

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

export const RESPONSE_SCHEMA = {
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

export const CONTACT_FIELDS = [
  "display_name",
  "phone",
  "email",
  "street_address",
  "city",
  "state",
  "zip_code",
  "notes",
];

export const FIELD_LABELS = {
  display_name: "Name",
  phone: "Phone",
  email: "Email",
  street_address: "Street Address",
  city: "City",
  state: "State",
  zip_code: "ZIP Code",
  notes: "Notes",
  confidence: "Confidence",
  fields_to_verify: "Fields to Verify",
  review: "Review",
};

// Human-readable labels for the Fields to Verify column.
export function verifyLabels(fieldsToVerify = []) {
  if (!Array.isArray(fieldsToVerify)) return "";
  return fieldsToVerify
    .map((f) => FIELD_LABELS[f] || f)
    .filter(Boolean)
    .join(", ");
}