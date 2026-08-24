# Contracts (normative interfaces)

These are the only cross-language boundaries. Implementations may change; contracts should not without a schema bump.

Language bindings: [`types/typescript/`](../types/typescript/) · [`types/go/`](../types/go/)

Golden fixtures: [`examples/`](../examples/)

---

## 1. Edge ↔ KV — `LinkRecord`

- **Key (canonical)**: Base64 (StdEncoding, no padding strip) of the **UTF-8 bytes** of the absolute original URL.
  - Go: `base64.StdEncoding.EncodeToString([]byte(url))` → `types.KeyFor`
  - TypeScript (preferred): `btoa` over `TextEncoder().encode(url)` → `urlKey()` in `types/typescript/link-record.ts`
  - Avoid `btoa(unescape(encodeURIComponent(...)))` for non-ASCII URLs; it can diverge from Go.
- **Value**: JSON conforming to [`schemas/link-record.schema.json`](../schemas/link-record.schema.json)
- **Statuses**: `PENDING` | `HEALED` | `DEAD` | `HEALTHY`

| Status | Meaning | Edge behaviour |
|--------|---------|----------------|
| `PENDING` | Discovered, not yet verified | Leave `href` alone |
| `HEALED` | Dead + archive found | Rewrite `href` → `resolved_url`, add class / `data-autofix-*` |
| `DEAD` | Dead, no usable archive | Leave `href` (or optional client hint) |
| `HEALTHY` | Still reachable | Leave `href` alone |

---

## 2. Edge → Queue — `DiscoveryMessage`

Schema: [`schemas/discovery-message.schema.json`](../schemas/discovery-message.schema.json)

```json
{
  "urls": ["https://example.com/gone"],
  "discovered_at": "2026-08-23T19:00:00Z"
}
```

Produced only for URLs that had **no** KV record at rewrite time. Written with `waitUntil` so the response path stays fast.

---

## 3. Edge / Queue → Healer — `POST /v1/discover`

| Item | Schema |
|------|--------|
| Request body | [`schemas/discover-request.schema.json`](../schemas/discover-request.schema.json) |
| Success response | [`schemas/discover-response.schema.json`](../schemas/discover-response.schema.json) |

- Method: `POST`
- Content-Type: `application/json`
- Timeout (edge): 15 s (circuit-breaker protected)
- Idempotent: re-POSTing the same URL is safe; healer dedupes

Example request:

```json
{ "urls": ["https://example.com/gone", "https://other.example/404"] }
```

Example response:

```json
{ "enqueued": 2 }
```

---

## 4. Healer ↔ KV

Same `LinkRecord` schema and key rule as §1. Written via Cloudflare KV REST API (or Worker binding if co-located later).

---

## 5. Healer ↔ Wayback Machine

External, not versioned here. Healer uses:

```
GET https://archive.org/wayback/available?url={url}
```

Protected by its own circuit breaker. “No snapshot” is **not** a breaker trip.

---

## 6. Presentation (browser)

Optional progressive enhancement only. Edge rewrite is sufficient for correctness.

- `data-autofix-original` — original absolute URL when rewritten
- class `autofix-healed` — visual / analytics hook
- `rel="nofollow archived"` on healed links

Client script must **not** depend on lower-layer types (no raw `LinkRecord` in the browser).

---

## 7. Command centre ↔ Healer (ops HCI)

Normative detail: [`docs/COMMAND_CENTRE.md`](./COMMAND_CENTRE.md) · ADR-008.

| Surface | Contract |
|---------|----------|
| Health | `GET /healthz` — process liveness + circuit string |
| Metrics | `GET /metrics` — Prometheus names from OBSERVABILITY.md |
| Stats JSON (optional) | `GET /v1/admin/stats` — [`schemas/admin-stats-response.schema.json`](../schemas/admin-stats-response.schema.json) |

**Rules**

1. Command centre is a **read client** in Phase 7A (stats only).
2. Browser must not hold Cloudflare credentials or call KV/Wayback directly.
3. Write/supervise actions are Phase 7B and require auth + audit schemas first.
4. Grafana and other Prom consumers remain valid; they are not part of this boundary’s schema set.

---

## Invariants

1. One shared schema family across languages.
2. Request path is synchronous + non-blocking for healing work.
3. Idempotent hops (heal twice → same KV result).
4. Failures contained by circuit breakers; never cascade to full page failure.
5. Upper layers depend on interfaces, never on concrete language types of lower layers.
6. Ops UI depends only on published admin/metrics contracts (§7).
