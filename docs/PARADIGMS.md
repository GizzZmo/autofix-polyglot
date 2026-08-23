# Paradigms

## Streaming

HTMLRewriter processes tags as the response streams. Avoids buffering full documents.

## Declarative state

`status` on `LinkRecord` drives behavior. Code branches on state, does not invent parallel truths.

## Message-driven

Discovery is a message. The request path must not block on Wayback.

## Concurrent procedural

Go workers pull URLs from a channel and run a fixed pipeline: check → archive → write.

## Resilience patterns

- Timeout on every outbound call
- Exponential backoff on queue retry
- Circuit breaker when dependency failure rate is high

## Progressive enhancement

Client script is optional. Edge rewrite alone is enough for correct links.
