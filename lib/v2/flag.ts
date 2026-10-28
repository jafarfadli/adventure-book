/**
 * v1 or v2 for this request. v2 when ADVENTURE_V2=1 (server env, read per
 * request so flipping it needs only a restart) or when previewing with ?v=2;
 * ?v=1 forces the old reader while it still exists.
 */
export function isV2(v: string | string[] | undefined): boolean {
  const q = Array.isArray(v) ? v[0] : v;
  if (q === "1") return false;
  if (q === "2") return true;
  return process.env.ADVENTURE_V2 === "1";
}

/** Keep the preview flag on internal links while it is only a preview. */
export function v2Suffix(v: string | string[] | undefined): string {
  const q = Array.isArray(v) ? v[0] : v;
  return q === "2" && process.env.ADVENTURE_V2 !== "1" ? "?v=2" : "";
}
