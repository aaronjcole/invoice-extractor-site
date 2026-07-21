// Address verification — provider-pluggable. Default: free US Census geocoder
// (no API key, US addresses only). A keyed global provider (Google/Mapbox) can be
// swapped in via the ADDRESS_PROVIDER / GEOCODER_KEY env vars on the backend; when
// no global provider is configured and the address is non-US, we return "not checked".
//
// IMPORTANT: a verifier outage/rate-limit/absence is NEVER a failure. It returns
// "not checked", which does not by itself trigger a review.

export const ADDR_STATUS = {
  VERIFIED: "verified",
  CHECK: "check",
  NOT_CHECKED: "not checked",
  NONE: "", // no address present
};

// Simple rate limiting — if the verifier starts erroring repeatedly, back off
// so remaining rows show "not checked" instead of every row being flagged.
let consecutiveFailures = 0;
let backedOff = false;

function resetBackoff() {
  consecutiveFailures = 0;
  backedOff = false;
}

/**
 * Returns one of ADDR_STATUS. Never throws.
 */
export async function verifyAddress(extracted) {
  const hasAddress =
    extracted.street_address || extracted.city || extracted.state || extracted.zip_code;
  if (!hasAddress) return ADDR_STATUS.NONE;

  if (backedOff) return ADDR_STATUS.NOT_CHECKED;

  const isUS = isLikelyUS(extracted);
  if (!isUS) return ADDR_STATUS.NOT_CHECKED; // no global provider configured for non-US

  try {
    const ok = await censusGeocode(extracted);
    consecutiveFailures = 0;
    // "verified" requires geocoder match AND confidence high.
    if (ok && extracted.confidence === "high") return ADDR_STATUS.VERIFIED;
    return ADDR_STATUS.CHECK; // no match, or confidence below high
  } catch (e) {
    consecutiveFailures += 1;
    if (consecutiveFailures >= 3) {
      // Verifier is likely rate-limited or down — stop trying this batch.
      backedOff = true;
    }
    return ADDR_STATUS.NOT_CHECKED;
  }
}

// Expose reset for new batches.
export { resetBackoff as resetVerifier };

function isLikelyUS(extracted) {
  const state = (extracted.state || "").trim().toUpperCase();
  const zip = (extracted.zip_code || "").trim();
  // 2-letter US state code, or a US ZIP.
  return /^[A-Z]{2}$/.test(state) || /^\d{5}(-\d{4})?$/.test(zip);
}

async function censusGeocode(extracted) {
  const street = (extracted.street_address || "").trim();
  const city = (extracted.city || "").trim();
  const state = (extracted.state || "").trim();
  const zip = (extracted.zip_code || "").trim();

  const params = new URLSearchParams();
  if (street) params.set("street", street);
  if (city) params.set("city", city);
  if (state) params.set("state", state);
  if (zip) params.set("zip", zip);
  params.set("benchmark", "Public_AR_Current");
  params.set("format", "json");

  const url = `https://geocoding.geo.census.gov/geocoder/locations/address?${params.toString()}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`geocoder ${res.status}`);
    if (res.status === 429) throw new Error("rate-limited");
    const json = await res.json();
    const matches = json?.result?.addressMatches;
    return Array.isArray(matches) && matches.length > 0;
  } finally {
    clearTimeout(t);
  }
}