# Command centre contracts

Human–computer interface for **observing** and **supervising** AutoFix.

Contracts live here; runnable UI lives in [autofix-engine](https://github.com/GizzZmo/autofix-engine) (`command-centre/`).

Related: [OBSERVABILITY.md](./OBSERVABILITY.md) · [ADR-008](./adr/008-command-centre.md) · [ADR-009](./adr/009-supervised-admin.md)

---

## 1. Goals

| Mode | Purpose |
|------|----------|
| **Observe (Phase 7A)** | Live KPIs: heal outcomes, latency, circuits, queue depth, discover volume |
| **Supervise (Phase 7B)** | Human actions: re-heal URL, override status, reset circuit, pause discovery — with auth + audit |

Non-goals: multi-tenant RBAC, full log search, replacing Grafana.

---

## 2. Data sources (read path)

| Source | Role |
|--------|------|
| `GET /healthz` | Liveness + `wayback_circuit` string |
| `GET /metrics` | Prometheus text (names from OBSERVABILITY.md) |
| `GET /v1/admin/stats` | JSON snapshot for UI without Prom parsing |
| `GET /v1/admin/audit` | Recent audit events (auth required) |

The command centre **must not** call Cloudflare KV or Wayback directly; it goes through the healer.

---

## 3. `GET /v1/admin/stats`

Schema: [`schemas/admin-stats-response.schema.json`](../schemas/admin-stats-response.schema.json)

Golden fixture: [`examples/admin-stats/ok.json`](../examples/admin-stats/ok.json)

**Semantics**

- Values are **point-in-time** (or process lifetime counters), not guaranteed durable across restarts.
- Circuit `state_code` matches metric `autofix_circuit_state`: `0` closed, `1` half_open, `2` open.
- `links_written` mirrors `autofix_links_total` by status.

---

## 4. UI expectations (Phase 7A)

Minimal command centre **should**:

1. Let the operator set **healer base URL** (e.g. `http://localhost:8080`).
2. Poll `/healthz` and either `/metrics` or `/v1/admin/stats` on an interval (e.g. 5–15 s).
3. Display health, Wayback circuit, queue depth, discover counts, links written by status, optional latency summary.
4. Fail softly when CORS or network blocks.

Minimal command centre **must not**:

- Embed Cloudflare tokens in the static UI.
- Call write endpoints without an operator-supplied admin token (7B).

---

## 5. Supervision (Phase 7B)

| Surface | Contract |
|---------|----------|
| Writes | `POST /v1/admin/actions` — [`schemas/admin-action-request.schema.json`](../schemas/admin-action-request.schema.json) |
| Result | [`schemas/admin-action-response.schema.json`](../schemas/admin-action-response.schema.json) |
| Audit item | [`schemas/admin-audit-event.schema.json`](../schemas/admin-audit-event.schema.json) |

| Action | Intent |
|--------|--------|
| `link.requeue` | Enqueue URL(s) for another heal pass (bypasses in-process dedupe) |
| `link.override` | Write `LinkRecord` with operator `status` / optional `resolved_url` |
| `circuit.reset` | Force breaker to `closed` |
| `discovery.pause` | Stop workers consuming the internal queue |
| `discovery.resume` | Resume consumption |

**Auth**

```
Authorization: Bearer <ADMIN_TOKEN>
```

- If `ADMIN_TOKEN` is unset, the healer **must** return `503` on write endpoints.
- If the header is missing or wrong, return `401`.
- Stats/metrics/healthz do not require the token (network isolation still recommended).

**Audit**

Every authenticated write attempt emits:

- Structured log `event=admin.action` with `actor`, `action`, `reason`, `ok`, `audit_id`, `trace_id`
- An `AdminAuditEvent` stored in-process (recent ring) and/or forwarded to the log sink

`actor` and `reason` are **required** in the request body (never inferred only from the token).

---

## 6. Relationship to Grafana / OTel

Grafana remains a first-class consumer of metric names in OBSERVABILITY.md. The command centre is product-specific HCI. Distributed traces stay in the OTel backend (Tempo/Jaeger/etc.); the UI does not replace that.
