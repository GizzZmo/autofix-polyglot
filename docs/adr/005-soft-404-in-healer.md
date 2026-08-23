# ADR-005: Soft-404 heuristics stay in the healer

## Status

Accepted

## Context

Many sites return HTTP 200 with “page not found” content. Detecting this requires body inspection and heuristics.

## Decision

Soft-404 detection (title/body regexes, limited body read) runs **only in the Go healer**. The edge never fetches the target URL on the request path.

## Consequences

- Edge stays streaming and sub-ms for healthy traffic.
- Heuristics can evolve without redeploying the Worker.
- First-pass “is this dead?” is still a simple status / network check on the healer side.
