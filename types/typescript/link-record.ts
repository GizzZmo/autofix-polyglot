/**
 * AutoFix Polyglot — LinkRecord (L2 shared state)
 * Source of truth: schemas/link-record.schema.json
 * Keep in sync with Go types and the JSON Schema.
 */

export type LinkStatus = "PENDING" | "HEALED" | "DEAD" | "HEALTHY";

export interface LinkRecord {
  status: LinkStatus;
  original_url: string;
  resolved_url?: string;
  discovered_at?: string; // ISO-8601
  healed_at?: string; // ISO-8601
  reason?: string;
}

/** Canonical KV key for an absolute URL (must match Go keyFor). */
export function urlKey(url: string): string {
  // Prefer TextEncoder when available (Workers / modern browsers).
  // Produces the same bytes as Go's base64.StdEncoding.EncodeToString([]byte(url)).
  if (typeof TextEncoder !== "undefined") {
    const bytes = new TextEncoder().encode(url);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  // Fallback for older environments (may diverge on non-ASCII).
  return btoa(unescape(encodeURIComponent(url)));
}
