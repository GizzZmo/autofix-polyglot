# ADR-007: Schema versioning and polyglot-first evolution

## Status

Accepted

## Context

`LinkRecord` and related schemas are shared across languages and stored in KV. Uncoordinated changes break lookups or heal paths.

## Decision

1. Implicit **v1** for current schemas; breaking changes introduce explicit **v2** files and optional `schema_version`.
2. Additive changes are minor; removals/renames/type changes are major.
3. Deprecation window ≥ six months for fields and status values.
4. **Polyglot-first**: contract PRs merge here before engine implementation.

Details: `docs/VERSIONING.md`.

## Consequences

- Slower accidental breakage; slightly more process for cross-repo changes.
- KV can evolve via dual-write / lazy upgrade instead of big-bang rewrites.
