# AutoFix Polyglot — Roadmap

This repository is the **contract source of truth** for the multi-language, multi-paradigm AutoFix system.
Runnable code lives in [autofix-engine](https://github.com/GizzZmo/autofix-engine).

Goal: keep every language and runtime interchangeable behind stable, versioned interfaces.

---

## Current status (2026-08-23)

| Area | State |
|------|--------|
| Layer model (ISO-style) | Done — see `docs/` |
| LinkRecord schema | Done — `schemas/link-record.schema.json` |
| DiscoveryMessage schema | **Done (this commit)** |
| Discover API schemas | **Done (this commit)** |
| Contract catalogue | **Done — `docs/CONTRACTS.md`** |
| Language bindings | Not started |
| Golden test vectors | Not started |
| Observability contracts | Not started |

---

## Phases

### Phase 0 — Foundation (complete)

- [x] Layer diagram & responsibilities
- [x] Paradigm rationale per layer
- [x] ISO-style mapping (software, not networking)
- [x] Shared `LinkRecord` JSON Schema

### Phase 1 — Complete the contract surface (in progress → this commit)

- [x] `DiscoveryMessage` schema (Edge → Queue)
- [x] `POST /v1/discover` request & response schemas
- [x] Single catalogue of all boundaries (`docs/CONTRACTS.md`)
- [ ] Key encoding rule formalized (safe base64 of UTF-8 URL) as a normative note
- [ ] Version field / `$id` consistency across schemas

### Phase 2 — Multi-language type bindings

Generate or hand-maintain types so each runtime cannot drift:

| Language / runtime | Target |
|--------------------|--------|
| TypeScript (Edge Worker) | `types/link-record.ts`, `types/discovery.ts` |
| Go (Healer) | `types/linkrecord.go` (or embed schema validation) |
| JavaScript (browser client) | Minimal subset for `data-autofix-*` only |
| Optional | OpenAPI 3.1 for the discover HTTP surface |

Acceptance: engine code can import / copy-paste from this repo without inventing parallel structs.

### Phase 3 — Architecture Decision Records (ADRs)

- [ ] ADR-001: Why polyglot (runtime affinity > single language)
- [ ] ADR-002: Sync request path vs async heal path
- [ ] ADR-003: Circuit breaker placement (Edge→Healer, Healer→Wayback)
- [ ] ADR-004: KV key = base64(URL) and collision / length policy
- [ ] ADR-005: Soft-404 heuristics stay in healer, not edge

### Phase 4 — Golden examples & test vectors

- [ ] `examples/link-records/` — PENDING / HEALED / DEAD / HEALTHY fixtures
- [ ] `examples/discovery-messages/` — valid & invalid queue payloads
- [ ] Contract tests (JSON Schema validation) runnable in CI of this repo and referenced by engine

### Phase 5 — Observability contracts

- [ ] Structured log fields (common keys across TS + Go)
- [ ] Metrics names (heal latency, circuit open rate, queue depth)
- [ ] Optional OpenTelemetry semantic conventions note

### Phase 6 — Evolution & versioning

- [ ] Schema versioning strategy (`LinkRecord` v1 → v2 migration rules)
- [ ] Deprecation policy for status values / fields
- [ ] Keep polyglot ahead of engine: change contracts here first, then implement

---

## How to continue development

1. Prefer **contract changes in this repo** before code changes in `autofix-engine`.
2. Any new cross-language field must appear in the relevant JSON Schema first.
3. Update `docs/CONTRACTS.md` in the same PR as schema changes.
4. Mark roadmap checkboxes when a phase item lands.

---

## Non-goals (for now)

- Full reimplementation of the edge worker or healer inside this repo
- UI / dashboard
- Multi-archive backends beyond Wayback (may be future phase)
