# ADR-003: Circuit breaker placement

## Status

Accepted

## Context

Two external dependencies can fail or slow down: the healer HTTP endpoint and the Wayback Availability API.

## Decision

| Boundary | Location | Threshold (default) |
|----------|----------|---------------------|
| Edge → Healer | In-isolate CircuitBreaker (TS) | 5 failures / 30 s open |
| Healer → Wayback | Process-local CircuitBreaker (Go) | 5 failures / 60 s open |

“No archive found” does **not** count as a Wayback failure (does not trip the breaker).

When the Edge→Healer breaker is open, queue messages retry with longer delay.

## Consequences

- Cascading failure is contained.
- Temporary healer or archive outages do not take down the edge rewrite path.
