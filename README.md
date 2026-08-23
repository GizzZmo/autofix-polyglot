# AutoFix Polyglot

**Multi-language · multi-paradigm · ISO-style layered architecture** for a self-healing web layer.

Related implementation: [autofix-engine](https://github.com/GizzZmo/autofix-engine)

**Roadmap → [ROADMAP.md](./ROADMAP.md)** · **Contracts → [docs/CONTRACTS.md](./docs/CONTRACTS.md)** · **ADRs → [docs/adr/](./docs/adr/)**

---

## Idea

Borrow the *structure* of the **ISO/OSI model** (clear layers + stable interfaces), not the seven network protocols:

| Layer | Responsibility | Language / paradigm |
|-------|----------------|---------------------|
| **L7 Presentation** | UX hints on healed links | JavaScript (DOM) |
| **L6 Application** | Link semantics, `data-autofix-*` | HTML attributes |
| **L5 Edge policy** | Rewrite, discover, circuit to healer | TypeScript / Workers (streaming) |
| **L4 Async boundary** | Decouple request path from healing | Queues + HTTP |
| **L3 Domain services** | Soft-404, Wayback, verify | Go (concurrent workers) |
| **L2 Shared state** | Link health registry | Cloudflare KV (`LinkRecord`) |
| **L1 External world** | Origin HTML, archive.org, targets | HTTP |

**Polyglot rule:** change language only when the *runtime* changes (edge isolate vs long-running process vs browser).

**Multi-paradigm rule:** streaming rewrite ≠ message-driven discovery ≠ concurrent heal ≠ fail-fast resilience.

---

## Contracts (the real interfaces)

| Boundary | Contract |
|----------|----------|
| Edge ↔ KV | Key = UTF-8 base64(url); JSON `LinkRecord` |
| Edge ↔ Queue | `DiscoveryMessage` |
| Edge/Queue ↔ Healer | `POST /v1/discover` |
| Healer ↔ KV | Same `LinkRecord` via CF API |
| Healer ↔ Wayback | Availability API |

Stabilize contracts; swap implementations freely. Full catalogue: [docs/CONTRACTS.md](./docs/CONTRACTS.md).

### LinkRecord (shared schema)

```json
{
  "status": "PENDING | HEALED | DEAD | HEALTHY",
  "original_url": "https://…",
  "resolved_url": "https://web.archive.org/…",
  "discovered_at": "2026-08-23T00:00:00Z",
  "healed_at": "2026-08-23T00:01:00Z",
  "reason": "http_404 | soft_404 | circuit_open"
}
```

Schemas: [`schemas/`](./schemas/) · Types: [`types/`](./types/) · Examples: [`examples/`](./examples/)

### Validate contracts locally

```bash
npm ci
npm run validate   # Ajv draft 2020-12 against all examples (+ invalid must fail)
```

CI runs the same check on every push/PR to `main`.

---

## Paradigms in play

| Paradigm | Where |
|----------|--------|
| Streaming / event-driven | HTMLRewriter on the response |
| Declarative state | KV status as source of truth |
| Message-driven | Queue producer/consumer |
| Concurrent workers | Go pool over URL channel |
| Resilience | Timeouts, exponential backoff, circuit breakers |
| Progressive enhancement | Optional client script |

---

## Repo layout

```
autofix-polyglot/
├── ROADMAP.md
├── package.json                 # npm run validate
├── scripts/validate-schemas.mjs
├── .github/workflows/ci.yml
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONTRACTS.md
│   ├── PARADIGMS.md
│   ├── ISO-MAPPING.md
│   └── adr/
├── schemas/
├── types/
│   ├── typescript/
│   └── go/
├── examples/
│   ├── link-records/
│   ├── discovery-messages/
│   ├── discover-request/
│   ├── discover-response/
│   └── invalid/                 # must be rejected by schemas
└── README.md
```

Full runnable code lives in **[autofix-engine](https://github.com/GizzZmo/autofix-engine)** (Edge Worker, Go healer, client, deploy scripts).

---

## Design rules

1. One shared schema across languages (`LinkRecord` and siblings).
2. Sync on the request path; async for healing.
3. Never leak lower-layer types to the browser.
4. Idempotent hops (heal twice → same KV result).
5. Paradigm follows latency budget (edge ms, healer seconds, UI human-time).
6. **Change contracts here first**, then implement in the engine.

---

## License

Use freely; no warranty.
