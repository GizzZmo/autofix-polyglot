# ADR-006: Shared observability contracts

## Status

Accepted

## Context

Edge (TypeScript) and Healer (Go) currently log with ad-hoc `console` / `log` messages. Operators cannot reliably join a discovery event on the edge to a heal write in the healer without shared field names and metric vocabulary.

## Decision

Define normative **structured log keys**, **event names**, and **Prometheus-style metric names** in `docs/OBSERVABILITY.md`. OpenTelemetry mapping is optional and secondary to logs + metrics names.

## Consequences

- Engine work should adopt these keys when touching logging or metrics.
- New events/metrics are added in polyglot before code.
- High-cardinality labels (raw URLs) are forbidden on metrics.
