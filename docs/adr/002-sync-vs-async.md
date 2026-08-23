# ADR-002: Sync request path vs async heal path

## Status

Accepted

## Context

Healing (HEAD/GET + soft-404 + Wayback) can take hundreds of ms to seconds. Blocking the origin response would harm TTFB and availability.

## Decision

- **Request path (sync):** HTMLRewriter + KV lookup only. Rewrite if `HEALED`; otherwise leave link and mark for discovery.
- **Heal path (async):** Queue (or HTTP fallback) → Go worker pool → KV write-back.

Discovery is enqueued via `waitUntil` so the client response is not delayed.

## Consequences

- First visitors may still see a broken link until the healer finishes.
- Subsequent visitors benefit from the healed record.
- Edge never waits on Wayback.
