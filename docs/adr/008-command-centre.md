# ADR-008: Command centre (ops UI + admin contracts)

## Status

Accepted

## Context

Phases 0–6 define data and observability contracts. Operators still lack a first-party **human–computer** surface: heal statistics, circuit health, and (later) supervised actions. Relying only on raw Prometheus text and log tails does not support product ops or safe human-in-the-loop control of a self-healing system.

## Decision

1. **Polyglot first**: define read models and (future) admin action schemas here before engine UI code.
2. **Split observe vs supervise**: Phase 7A is **stats-only** (read); Phase 7B adds authenticated write actions with audit fields.
3. **Command centre is a client** of healer admin/metrics APIs — not embedded in the edge request path.
4. **No high-cardinality series**: stats aggregates only; raw URLs stay in logs/KV detail views, not metric labels.

Normative detail: `docs/COMMAND_CENTRE.md`.

## Consequences

- Engine may ship a minimal static UI that scrapes `/metrics` + `/healthz` and/or `GET /v1/admin/stats`.
- Write actions (override link, reset circuit) require auth + audit schema before implementation.
- Grafana remains a valid alternative consumer of the same metric names in `OBSERVABILITY.md`.
