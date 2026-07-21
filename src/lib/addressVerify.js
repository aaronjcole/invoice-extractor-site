// Address verification is performed SERVER-SIDE by a backend function (verifyAddress)
// to avoid browser CORS failures and to keep the geocoder provider/key off the client.
// Backend functions require the Builder plan on Base44.
//
// Until that is enabled, we honestly report "not checked" for any address rather than
// attempting a browser fetch to the US Census geocoder, which is blocked by CORS and would
// silently turn every address into "not checked" anyway. "not checked" NEVER flags a row.
//
// When the backend function is wired up, replace this module with a call to it:
//   const res = await base44.functions.invoke("verifyAddress", { ...extracted });
//   return res.data.status;   // "verified" | "check" | "not checked" | ""

export const ADDR_STATUS = {
  VERIFIED: "verified",
  CHECK: "check",
  NOT_CHECKED: "not checked",
  NONE: "",
};

// No-op until server-side verification is wired up.
export function resetVerifier() {}

export async function verifyAddress(extracted) {
  const hasAddress =
    extracted.street_address || extracted.city || extracted.state || extracted.zip_code;
  if (!hasAddress) return ADDR_STATUS.NONE;
  return ADDR_STATUS.NOT_CHECKED;
}