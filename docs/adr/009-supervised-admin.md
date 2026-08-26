# ADR-009: Supervised admin writes (Phase 7B)

## Status

Accepted

## Context

Phase 7A gave operators a read-only command centre. Operators still need to re-queue a URL, override a false-positive status, or reset a stuck Wayback circuit. Unauthenticated mutation of KV or breakers is unacceptable.

## Decision

1. All write actions go through `POST /v1/admin/actions` with a single request schema (`AdminActionRequest`).
2. Auth is mandatory when writes are enabled: `Authorization: Bearer <ADMIN_TOKEN>` (or equivalent gateway). If no token is configured, the process must reject writes (503).
3. Every attempt (success or failure after auth) produces an `AdminAuditEvent` (`actor`, `action`, `reason`, `ts`, `before`/`after` when applicable) and a structured log `event=admin.action`.
4. Actions are a closed vocabulary: `link.requeue`, `link.override`, `circuit.reset`, `discovery.pause`, `discovery.resume`.
5. The browser command centre never holds Cloudflare tokens; it only holds (or proxies) the healer admin token if the operator pastes it locally.

## Consequences

- Engine implements auth middleware + audit ring + action handlers.
- Stats (`GET /v1/admin/stats`, `/metrics`, `/healthz`) remain readable without the admin token for internal networks; operators may still put them behind a proxy.
- New actions require a polyglot schema bump before engine code.
