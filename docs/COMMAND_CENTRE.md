# Command centre contracts

Human–computer interface for **observing** and (later) **supervising** AutoFix.

Contracts live here; runnable UI lives in [autofix-engine](https://github.com/GizzZmo/autofix-engine) (`command-centre/`).

Related: [OBSERVABILITY.md](./OBSERVABILITY.md) · [ADR-008](./adr/008-command-centre.md)

---

## 1. Goals

| Mode | Purpose |
|------|----------|
| **Observe (Phase 7A)** | Live KPIs: heal outcomes, latency, circuits, queue depth, discover volume |
| **Supervise (Phase 7B)** | Human actions: re-heal URL, override status, reset circuit, pause discovery — with audit |

Non-goals for 7A: multi-tenant RBAC, full log search, replacing Grafana.

---

## 2. Data sources (read path)

| Source | Role |
|--------|------|
| `GET /healthz` | Liveness + `wayback_circuit` string |
| `GET /metrics` | Prometheus text (names from OBSERVABILITY.md) |
| `GET /v1/admin/stats` | Optional JSON snapshot (schema below) for UI without Prom parsing |

The command centre **must not** call Cloudflare KV or Wayback directly; it goes through the healer (or a future admin gateway).

---

## 3. `GET /v1/admin/stats` (optional JSON)

Schema: [`schemas/admin-stats-response.schema.json`](../schemas/admin-stats-response.schema.json)

Purpose: a low-cardinality snapshot for UIs that prefer JSON over Prometheus exposition.

**Semantics**

- Values are **point-in-time** (or process lifetime counters), not guaranteed durable across restarts unless the implementation persists them.
- `circuit_state` uses the same encoding as metric `autofix_circuit_state`: `0` closed, `1` half_open, `2` open.
- `links_written` mirrors counter `autofix_links_total` by status (lifetime of process unless noted).

Example:

```json
{
  "service": "autofix-healer",
  "ts": "2026-08-24T19:00:00Z",
  "health": "ok",
  "circuits": [
    { "name": "healer_wayback", "state": "closed", "state_code": 0, "trips_total": 0 }
  ],
  "queue_depth": 3,
  "discover_requests_total": { "http": 12, "queue": 0 },
  "links_written": {
    "PENDING": 1,
    "HEALED": 4,
    "DEAD": 2,
    "HEALTHY": 5
  },
  "heal_duration_seconds": {
    "count": 11,
    "sum": 4.2
  }
}
```

---

## 4. UI expectations (Phase 7A)

Minimal command centre **should**:

1. Let the operator set **healer base URL** (e.g. `http://localhost:8080`).
2. Poll `/healthz` and either `/metrics` or `/v1/admin/stats` on an interval (e.g. 5–15 s).
3. Display:
   - Health + Wayback circuit
   - Queue depth
   - Discover request counts
   - Links written by status
   - Optional: simple latency summary from histogram count/sum
4. Fail softly when CORS or network blocks (show error, do not crash).

Minimal command centre **must not** (7A):

- Mutate link records or circuits without Phase 7B contracts + auth.
- Embed secrets in the static UI (no CF tokens in browser).

---

## 5. Supervision (Phase 7B — future)

Draft action catalogue (schemas TBD):

| Action | Intent |
|--------|--------|
| `link.requeue` | POST URL(s) to `/v1/discover` with audit |
| `link.override` | Write `LinkRecord` with operator reason |
| `circuit.reset` | Clear breaker state |
| `discovery.pause` | Stop consuming internal queue |

Every write requires: `actor`, `action`, `ts`, `before`/`after` (or equivalent audit log).

---

## 6. Auth

- **7A (stats)**: network isolation or reverse-proxy auth is enough for internal use; document exposure risk of `/metrics`.
- **7B (writes)**: mandatory auth (token, mTLS, or Cloudflare Access). Never ship open admin write endpoints.

---

## 7. Relationship to Grafana

Grafana (or any PromQL UI) remains a first-class consumer of metric **names** in OBSERVABILITY.md. The command centre is product-specific HCI, not a replacement for general observability stacks.
