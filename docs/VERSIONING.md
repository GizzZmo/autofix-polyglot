# Schema versioning & deprecation

How contracts in this repository evolve without breaking Edge and Healer independently.

---

## 1. Version identity

| Artifact | Version signal |
|----------|----------------|
| JSON Schema `$id` | URL path is stable; breaking changes use a new file or `$id` suffix |
| Schema file name | `link-record.schema.json` is **v1** (implicit). Next major → `link-record.v2.schema.json` |
| Runtime JSON | Optional `schema_version` field (integer, default `1` when absent) |
| Git | Tags `contracts-v1`, `contracts-v2` when a major set is frozen |

**Current:** all schemas are **v1**. Absence of `schema_version` in stored `LinkRecord` means v1.

---

## 2. Compatibility rules

### Non-breaking (same major)

Allowed without a new major version:

- Add **optional** properties (not in `required`)
- Add new **enum** values only if all readers treat unknown enums as safe (see deprecation / unknown handling)
- Expand documentation, examples, ADRs
- Add new schemas for new boundaries

Readers **must ignore** unknown properties (`additionalProperties` may stay `false` on write; readers in other languages should still tolerate extras when migrating).

### Breaking (new major)

Requires `v2` (or higher):

- Remove or rename a property
- Change a property’s type or format meaning
- Remove an enum value that producers still emit
- Change KV key encoding algorithm
- Tighten `required` in a way that invalidates existing KV rows

---

## 3. LinkRecord v1 → v2 migration rules

When a v2 schema is introduced:

1. **Publish** `schemas/link-record.v2.schema.json` and types under `types/` **in polyglot first**.
2. **Dual-write window** (engine):
   - Writers may write v2 documents that remain readable as v1 where possible (additive fields).
   - If a field is renamed, write **both** old and new during the window.
3. **Readers**:
   - Accept v1 and v2 (branch on `schema_version` or presence of v2-only fields).
   - Prefer v2 fields when both exist.
4. **KV**:
   - Same key encoding unless ADR says otherwise (key algorithm change is always major).
   - No mass rewrite required if v2 is additive; for renames, lazy upgrade on read/write is preferred over full namespace scan.
5. **End of window**:
   - Stop writing v1-only shapes.
   - Document minimum engine versions that require v2.
6. **Examples & CI**:
   - Keep v1 fixtures until the window ends; add v2 fixtures immediately.
   - Validator suites list both schema files during transition.

### Suggested v2 additive pattern

```json
{
  "schema_version": 2,
  "status": "HEALED",
  "original_url": "https://example.com/gone",
  "resolved_url": "https://web.archive.org/…",
  "discovered_at": "2026-08-23T19:00:00Z",
  "healed_at": "2026-08-23T19:01:00Z",
  "reason": "http_404"
}
```

`schema_version` is optional on v1; recommended on all new writes once v2 exists.

---

## 4. Deprecation policy (fields & status values)

### Status values (`PENDING` | `HEALED` | `DEAD` | `HEALTHY`)

| Change | Policy |
|--------|--------|
| Add status | Minor: document in schema enum + CONTRACTS + examples; engine may emit only after polyglot merge |
| Deprecate status | Mark in docs as deprecated; keep in enum ≥ **6 months** or two minor releases; readers map deprecated → successor |
| Remove status | Major version only; after deprecation window; migration note required |

Unknown status at read time: **do not crash**. Edge treats unknown like “no rewrite” (pass-through). Healer may re-queue or leave unchanged.

### Fields

| Change | Policy |
|--------|--------|
| Add optional field | Minor |
| Deprecate field | Docs + schema description `"deprecated": true` (or description prefix `DEPRECATED:`); keep accepted ≥ **6 months** |
| Remove field | Major; dual-read during transition |

### `reason` strings

Free-form but prefer stable tokens: `http_404`, `soft_404`, `network_error`, `circuit_open`, `invalid_url`.  
New tokens are minor; removing a token producers still emit is major.

---

## 5. Polyglot-first process

**Invariant:** change contracts **here** before implementing in [autofix-engine](https://github.com/GizzZmo/autofix-engine).

```
1. PR on autofix-polyglot
   - schema / types / examples / CONTRACTS / this doc / ROADMAP
   - CI: npm run validate
2. Merge polyglot
3. PR on autofix-engine
   - implement against merged contracts
   - reference polyglot commit or tag
4. Do not land engine-only contract drift
```

Exceptions (docs-only typos, comment fixes) may skip the engine step.

If engine discovers a needed field in production, open a polyglot PR **first** (even a minimal schema stub), then the engine change.

---

## 6. API surface (`/v1/discover`)

- URL path major (`/v1/`, `/v2/`) tracks breaking HTTP contract changes.
- Additive JSON fields on request/response follow the same non-breaking rules as schemas.
- Deprecate query/body fields with the same 6-month window; remove only in `/v2/`.

---

## Checklist for a breaking change

- [ ] New schema file (or `$id`) + types + examples  
- [ ] Migration section in this file  
- [ ] ADR if key encoding, status model, or layer boundaries change  
- [ ] CONTRACTS.md updated  
- [ ] ROADMAP / release note  
- [ ] Engine dual-read/dual-write plan dated  
