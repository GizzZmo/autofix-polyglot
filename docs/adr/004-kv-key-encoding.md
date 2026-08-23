# ADR-004: KV key = base64 of UTF-8 URL

## Status

Accepted

## Context

KV keys must be deterministic across Edge (JS) and Healer (Go), support arbitrary URLs (including non-ASCII), and avoid collisions.

## Decision

- Key = Standard Base64 encoding of the **UTF-8 byte sequence** of the absolute URL string.
- Go: `base64.StdEncoding.EncodeToString([]byte(url))`
- TypeScript: encode with `TextEncoder`, then `btoa` on the resulting binary string (see `types/typescript/link-record.ts`).

Do **not** use `btoa(unescape(encodeURIComponent(url)))` as the primary path; it can diverge for non-ASCII.

## Consequences

- Keys are opaque and safe for the KV API.
- Implementations must share the same encoding or lookups miss.
- Very long URLs may hit KV key length limits; document and truncate/hash only if that becomes real (not yet).
