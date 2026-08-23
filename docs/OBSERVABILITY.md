# Observability contracts

Cross-language contracts for **logs** and **metrics**. Implementations (Edge Worker TypeScript, Go healer) should emit these keys/names so operators can correlate a single heal path across runtimes.

These are **normative field names**, not a mandated logging library. Edge may use `console` JSON lines; healer may use structured `log/slog` or equivalent.

---

## 1. Structured log fields

### Required on every log line (when structured)

| Key | Type | Description |
|-----|------|-------------|
| `ts` | string (ISO-8601) | Event time (UTC preferred) |
| `level` | string | `debug` \| `info` \| `warn` \| `error` |
| `event` | string | Stable event name (see catalogue below) |
| `component` | string | `edge` \| `healer` \| `client` |

### Common optional fields

| Key | Type | Description |
|-----|------|-------------|
| `layer` | string | Soft layer id, e.g. `L5`, `L3` (see ISO mapping) |
| `url` | string | Absolute original URL (omit or hash in high-volume paths if PII policy requires) |
| `url_key` | string | KV key (base64 of URL) when correlating with storage |
| `status` | string | `LinkRecord.status` when relevant |
| `reason` | string | `LinkRecord.reason` or failure cause |
| `resolved_url` | string | Archive / healed target |
| `duration_ms` | number | Wall time for the operation |
| `attempt` | number | Queue retry attempt (0-based or 1-based; document in emitter) |
| `circuit` | string | `closed` \| `open` \| `half_open` |
| `circuit_name` | string | `edge_healer` \| `healer_wayback` |
| `msg_id` | string | Queue message id |
| `count` | number | Batch size (e.g. URLs enqueued) |
| `error` | string | Short error message (no secrets) |
| `trace_id` | string | Optional correlation id (W3C trace id if OTel is used) |

**Rules**

1. Prefer **snake_case** keys everywhere (JSON in both TS and Go).
2. Do not log Cloudflare API tokens, healer secrets, or full request headers.
3. `event` values are a closed vocabulary for a given major version; extend via polyglot first.

### Event catalogue (v1)

| `event` | Component | When |
|---------|-----------|------|
| `link.rewrite` | edge | `href` rewritten to healed URL |
| `link.discover` | edge | New URL(s) marked PENDING / enqueued |
| `queue.send` | edge | Discovery message sent to queue |
| `queue.fallback_http` | edge | Queue failed; HTTP discover used |
| `queue.consume` | edge | Queue batch item processed |
| `queue.retry` | edge | Message retried (include `attempt`, `error`) |
| `healer.forward` | edge | POST `/v1/discover` attempted |
| `circuit.open` | edge / healer | Breaker opened |
| `circuit.close` | edge / healer | Breaker closed after success |
| `heal.check` | healer | Link verified (alive or dead) |
| `heal.archive` | healer | Wayback lookup result |
| `heal.write` | healer | KV `LinkRecord` written |
| `heal.defer` | healer | Deferred due to circuit open |

### Example (Edge)

```json
{
  "ts": "2026-08-23T19:45:00.123Z",
  "level": "info",
  "event": "link.discover",
  "component": "edge",
  "layer": "L5",
  "count": 3,
  "duration_ms": 12
}
```

### Example (Healer)

```json
{
  "ts": "2026-08-23T19:45:02.500Z",
  "level": "info",
  "event": "heal.write",
  "component": "healer",
  "layer": "L3",
  "url": "https://example.com/gone",
  "status": "HEALED",
  "reason": "http_404",
  "resolved_url": "https://web.archive.org/web/…",
  "duration_ms": 840
}
```

---

## 2. Metrics names

Prometheus-style names (counters / histograms / gauges). Labels use low cardinality.

### Core metrics

| Name | Type | Labels | Description |
|------|------|--------|-------------|
| `autofix_heal_duration_seconds` | histogram | `result` (`healthy`\|'healed'\|'dead'\|'deferred`) | End-to-end heal path latency in healer |
| `autofix_check_duration_seconds` | histogram | `outcome` (`alive`\|'dead`\|'error`) | Target URL check only |
| `autofix_wayback_duration_seconds` | histogram | `outcome` (`hit`\|'miss'\|'error`\|'circuit_open`) | Wayback Availability API call |
| `autofix_circuit_state` | gauge | `name` (`edge_healer`\|'healer_wayback`) | `0`=closed, `1`=half_open, `2`=open |
| `autofix_circuit_trips_total` | counter | `name` | Times breaker transitioned to open |
| `autofix_queue_depth` | gauge | — | Approximate pending discovery messages (if available) |
| `autofix_queue_messages_total` | counter | `result` (`ack`\|'retry`) | Queue consumer outcomes |
| `autofix_discover_requests_total` | counter | `source` (`queue`\|'http`) | Inbound `/v1/discover` |
| `autofix_links_total` | counter | `status` (`PENDING`\|'HEALED'\|'DEAD'\|'HEALTHY`) | KV writes by status |
| `autofix_rewrite_total` | counter | `action` (`healed`\|'pass`) | Edge rewrite decisions per link |

**Histogram buckets (suggested)**  
`0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30` seconds for heal/wayback; tighter for edge-only ops if instrumented.

**Label rules**

- Never put raw URLs in labels (cardinality explosion).
- Prefer enums already defined in contracts (`status`, circuit `name`).

---

## 3. OpenTelemetry (optional)

When OTel is introduced, map as follows. OTel is **optional**; structured logs + Prometheus names above remain the baseline contract.

| AutoFix concept | OTel mapping |
|-----------------|--------------|
| Heal one URL | Span `autofix.heal` (kind INTERNAL) |
| Check target | Child span `autofix.check` |
| Wayback call | Child span `autofix.wayback` (kind CLIENT) |
| Edge → Healer POST | Span `autofix.discover` (kind CLIENT on edge; SERVER on healer) |
| `trace_id` log field | W3C `traceparent` trace-id |
| Metric names | Same as §2, or OTel instruments with identical semantic names |

**Attributes (span)**

- `autofix.url` — original URL (policy-dependent)
- `autofix.status` — final `LinkRecord.status`
- `autofix.reason`
- `autofix.circuit.name` / `autofix.circuit.state`

Resource attributes: `service.name` = `autofix-edge` \| `autofix-healer`.

---

## Implementation notes

- **Edge**: Workers lack long-lived process metrics; prefer log events + Cloudflare analytics, or export histograms via a metrics sink if bound later.
- **Healer**: Prefer Prometheus `/metrics` or OTLP; `/healthz` already exposes `wayback_circuit` — align that string with `circuit` log field values.
- New events or metric names land in **this document first**, then in engine code.
