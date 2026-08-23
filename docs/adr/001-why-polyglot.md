# ADR-001: Why polyglot (runtime affinity > single language)

## Status

Accepted

## Context

AutoFix spans three very different runtimes:

1. Cloudflare Workers (isolates, ~ms budget, streaming HTML)
2. Long-running Go process (concurrent I/O, soft-404 + Wayback)
3. Browser (optional progressive enhancement)

A single language would force compromises on latency, concurrency model, or deployment surface.

## Decision

Change language **only when the runtime changes**. Share contracts (JSON Schema + hand-maintained types), not a monorepo of one language.

## Consequences

- Contracts live in this repo; implementations in `autofix-engine`.
- Each layer can use the paradigm that fits its latency budget.
- Drift is prevented by schemas + type stubs, not by forcing one language.
