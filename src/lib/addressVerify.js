// Client-side address verification via Nominatim (OpenStreetMap) — no API key, CORS-enabled.
// Honors OSM usage policy: throttled to ~1 request/second; the browser sends Referer as
// identification (User-Agent cannot be set from the browser). Attribution shown in the footer.
// A verifier outage/rate-limit NEVER flags a row — it resolves to "not checked".

export const ADDR_STATUS = {
  VERIFIED: "verified",
  CHECK: "check",
  NOT_CHECKED: "not checked",
  NONE: "",
};

const MIN_INTERVAL_MS = 1100; // OSM: max ~1 req/sec
let lastCallTs = 0;
let consecutiveFailures = 0;
let backedOff = false;

export function resetVerifier() {
  consecutiveFailures = 0;
  backedOff = false;
}

function isLikelyUS(extracted) {
  const state = (extracted.state || "").trim().toUpperCase();
  const zip = (extracted.zip_code || "").trim();
  return /^[A-Z]{2}$/.test(state) || /^\d{5}(-\d{4})?$/.test(zip);
}

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastCallTs));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallTs = Date.now();
}

async function nominatimMatch(extracted) {
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    countrycodes: "us",
    addressdetails: "1",
  });
  if (extracted.street_address) params.set("street", extracted.street_address);
  if (extracted.city) params.set("city", extracted.city);
  if (extracted.state) params.set("state", extracted.state);
  if (extracted.zip_code) params.set("postalcode", extracted.zip_code);

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`geocoder ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) && json.length > 0;
  } finally {
    clearTimeout(t);
  }
}

export async function verifyAddress(extracted) {
  const hasAddress =
    extracted.street_address || extracted.city || extracted.state || extracted.zip_code;
  if (!hasAddress) return ADDR_STATUS.NONE;
  if (backedOff) return ADDR_STATUS.NOT_CHECKED;
  if (!isLikelyUS(extracted)) return ADDR_STATUS.NOT_CHECKED;

  try {
    await throttle();
    const matched = await nominatimMatch(extracted);
    consecutiveFailures = 0;
    if (matched && extracted.confidence === "high") return ADDR_STATUS.VERIFIED;
    return ADDR_STATUS.CHECK;
  } catch {
    consecutiveFailures += 1;
    if (consecutiveFailures >= 3) backedOff = true;
    return ADDR_STATUS.NOT_CHECKED;
  }
}