# ISO-style mapping (software layers)

This is **not** the OSI network stack. It is the same *idea*: ordered layers, narrow interfaces, replaceable guts.

| Soft layer | AutoFix | OSI metaphor |
|------------|---------|--------------|
| L7 Presentation | Client JS affordances | What the human sees |
| L6 Application | Link rewrite semantics | Application meaning |
| L5 Session/Policy | Worker rewrite + discover policy | Who decides |
| L4 Transport | Queue + HTTP discover | Reliable delivery between services |
| L3 Network/Domain | Healer domain logic | Routing of work to checks/archive |
| L2 Data link/State | KV records | Shared framed state |
| L1 Physical/World | Real HTTP endpoints | Bits on the wire to the outside |

**Invariants**

- Upper layers depend on lower interfaces, not implementations.
- A layer may change language without breaking neighbors if contracts hold.
- Failures should be contained (circuit open at L5/L3, not a full outage at L7).
