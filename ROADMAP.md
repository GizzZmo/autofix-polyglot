# AutoFix Polyglot — Roadmap

This repository is the **contract source of truth** for the multi-language, multi-paradigm AutoFix system.
Runnable code lives in [autofix-engine](https://github.com/GizzZmo/autofix-engine).

Goal: keep every language and runtime interchangeable behind stable, versioned interfaces.

---

## Current status (2026-08-26)

| Area | State |
|------|--------|
| Layer model (ISO-style) | Done — see `docs/` |
| LinkRecord schema | Done |
| Discovery + Discover API schemas | Done |
| Contract catalogue | Done — `docs/CONTRACTS.md` |
| Language bindings (TS + Go) | Done (skeleton) — `types/` |
| Golden examples | Done — `examples/` (+ invalid cases) |
| Schema validation CI | Done — `.github/workflows/ci.yml` |
| ADRs | Done (001–008) — `docs/adr/` |
| Observability contracts | **Done** — `docs/OBSERVABILITY.md` |
| Versioning & deprecation | **Done** — `docs/VERSIONING.md` |
| Command centre contracts | **Done (7A)** — `docs/COMMAND_CENTRE.md` |
| Key encoding formalized | Done |

---

## Phases

### Phase 0 — Foundation (complete)

- [x] Layer diagram & responsibilities
- [x] Paradigm rationale per layer
- [x] ISO-style mapping (software, not networking)
- [x] Shared `LinkRecord` JSON Schema

### Phase 1 — Complete the contract surface (complete)

- [x] `DiscoveryMessage` schema (Edge → Queue)
- [x] `POST /v1/discover` request & response schemas
- [x] Single catalogue of all boundaries (`docs/CONTRACTS.md`)
- [x] Key encoding rule formalized (UTF-8 bytes → Std base64)
- [x] Version field / `$id` consistency across schemas

### Phase 2 — Multi-language type bindings (skeleton complete)

| Language / runtime | Target | Status |
|--------------------|--------|--------|
| TypeScript (Edge Worker) | `types/typescript/*.ts` | Done (skeleton) |
| Go (Healer) | `types/go/linkrecord.go` | Done (skeleton) |
| JavaScript (browser client) | Minimal subset for `data-autofix-*` only | Pending |
| Optional | OpenAPI 3.1 for the discover HTTP surface | Pending |

**Next:** wire engine to these types (or generate from schema); adopt observability field names when touching logs.

### Phase 3 — Architecture Decision Records (ADRs) (complete for core set)

- [x] ADR-001: Why polyglot (runtime affinity > single language)
- [x] ADR-002: Sync request path vs async heal path
- [x] ADR-003: Circuit breaker placement (Edge→Healer, Healer→Wayback)
- [x] ADR-004: KV key = base64(URL) and collision / length policy
- [x] ADR-005: Soft-404 heuristics stay in healer, not edge
- [x] ADR-006: Shared observability contracts
- [x] ADR-007: Schema versioning and polyglot-first evolution
- [x] ADR-008: Command centre (ops UI + admin contracts)

### Phase 4 — Golden examples & test vectors (complete)

- [x] `examples/link-records/` — PENDING / HEALED / DEAD / HEALTHY fixtures
- [x] `examples/discovery-messages/` — valid queue payload
- [x] `examples/discover-request/` + `discover-response/`
- [x] Invalid / edge-case fixtures under `examples/invalid/`
- [x] Contract tests (JSON Schema validation) in CI — `npm run validate`

### Phase 5 — Observability contracts (complete)

- [x] Structured log fields (common keys across TS + Go) — `docs/OBSERVABILITY.md`
- [x] Metrics names (heal latency, circuit open rate, queue depth)
- [x] Optional OpenTelemetry semantic conventions note

### Phase 6 — Evolution & versioning (complete)

- [x] Schema versioning strategy (`LinkRecord` v1 → v2 migration rules) — `docs/VERSIONING.md`
- [x] Deprecation policy for status values / fields
- [x] Keep polyglot ahead of engine: change contracts here first, then implement

### Phase 7 — Command centre (HCI + admin contracts)

**7A — Observe (stats)** — **complete**

- [x] ADR-008 + `docs/COMMAND_CENTRE.md`
- [x] `GET /v1/admin/stats` response schema (`schemas/admin-stats-response.schema.json`)
- [x] Catalogue boundary in `docs/CONTRACTS.md` §7
- [x] Engine: minimal command-centre UI (`command-centre/`, prefers JSON stats, falls back to `/metrics`)
- [x] Engine: `GET /v1/admin/stats` JSON endpoint + CORS middleware
- [ ] Golden example for admin-stats response + CI validate (optional polish)

**7B — Supervise (writes)** — future

- [ ] Admin action schemas (requeue, override, circuit reset) + audit fields
- [ ] Auth requirements (token / Access / mTLS)
- [ ] Engine implementation of write paths

---

## How to continue development

1. Prefer **contract changes in this repo** before code changes in `autofix-engine` (see `docs/VERSIONING.md` §5).
2. Any new cross-language field must appear in the relevant JSON Schema first.
3. Update `docs/CONTRACTS.md` in the same PR as schema changes.
4. Mark roadmap checkboxes when a phase item lands.
5. After type changes, update the corresponding engine files so they stay aligned.
6. Run `npm run validate` (or rely on CI) before merging schema/example changes.
7. When adding logs/metrics in the engine, use names from `docs/OBSERVABILITY.md`.
8. Command centre UI must consume only published admin/metrics contracts — no direct KV/Wayback from the browser.

---

## Suggested follow-ups

- Wire engine types to `types/` (or codegen from schemas)
- Optional OpenAPI 3.1 for `/v1/discover` + `/v1/admin/*`
- Browser client type subset for `data-autofix-*`
- Phase 7B supervised actions + audit
- Golden admin-stats example + CI
- Multi-archive backends beyond Wayback (may be future phase)

---

## Non-goals (for now)

- Full reimplementation of the edge worker or healer inside this repo
- Multi-tenant SaaS control plane
- Replacing general observability stacks (Grafana remains valid)
