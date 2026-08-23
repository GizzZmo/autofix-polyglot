# Architecture

## Layer diagram

```
Browser (JS)
    │  DOM / data-autofix-*
    ▼
Edge Worker (TypeScript)
    │  HTMLRewriter + circuit breaker
    ├──────────────► Cloudflare KV  (LinkRecord)
    │
    └──────────────► Queue / HTTP
                          │
                          ▼
                    Go Healer
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         Check link   Wayback API   KV write
```

## Request path (sync)

1. Fetch origin HTML.
2. For each external `a[href]`, lookup KV.
3. If `HEALED`, rewrite `href` + mark class.
4. If unknown, mark `PENDING` and enqueue discovery (`waitUntil`).

## Heal path (async)

1. Queue consumer or HTTP → `POST /v1/discover`.
2. Worker pool verifies URL (HEAD/GET + soft-404).
3. Dead → Wayback; success → `HEALED`, else `DEAD` / `PENDING` if circuit open.
4. Write `LinkRecord` to KV.

## Resilience

- Queue ack/retry + exponential backoff
- Circuit breaker: Edge→Healer, Healer→Wayback
- Optional DLQ after max retries
