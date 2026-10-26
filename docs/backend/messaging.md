# Messaging and Integration Events

This document defines the intended messaging architecture for BustHub. Messaging components described as planned must not be treated as implemented until their projects and behavior exist in the repository.

## 1. Current State

Wolverine is used for internal application handler dispatching through `Adapters.Wolverine`.

RabbitMQ-based integration messaging, the dedicated messaging adapters, and the Outbox/Inbox processing flow are planned future capabilities.

Do not add broker dependencies to domain types or introduce messaging infrastructure into an unrelated feature without an explicit requirement.

## 2. Distinguish Event Types

### Domain Events

Domain events represent meaningful occurrences within the domain.

- They are created through aggregate-root behavior.
- They remain internal to the domain/application boundary.
- They do not define broker serialization or an external service contract.
- They must not depend on RabbitMQ, Wolverine transport configuration, or HTTP.

### Integration Events

Integration events communicate facts across independently operating components or services.

- They are external contracts.
- They must not be placed in `Core.Domain`.
- They should be versioned and evolved with compatibility in mind.
- Their consumers must not rely on the producer's internal entity structure.

A domain event may result in an integration event, but not every domain event must be published externally.

## 3. Planned Project Boundaries

The intended projects are:

| Project | Responsibility |
|---|---|
| `Adapters.Wolverine` | Internal application handler dispatching |
| `Adapters.Inbound.Messaging` | Future inbound message consumption and inbox processing |
| `Adapters.Outbound.RabbitMq` | Future outbound broker publication and outbox processing |
| `Contracts.Messaging` | Integration-event contracts published or consumed by the service |

`Contracts.Messaging` is a separate class library, not merely a folder inside the backend application.

Its intended organization is:

```text
Contracts.Messaging/
└── IntegrationEvents/
    ├── In/
    └── Out/
```

- `In` contains integration-event contracts consumed by this service.
- `Out` contains integration-event contracts published by this service.

Follow the actual project naming and namespace conventions when these projects are created. Do not create empty projects merely to make the planned structure appear implemented.

## 4. Planned Outbound Flow

The intended outbound flow is:

1. An application handler invokes domain behavior.
2. The aggregate root records relevant domain events.
3. The unit-of-work coordinates persistence and domain-event processing.
4. Domain-event handlers map applicable domain events to integration-event contracts.
5. Outbox records are persisted in the same PostgreSQL transaction as the business changes.
6. A separate worker reads pending outbox records.
7. The worker publishes them to RabbitMQ.
8. Successfully published records are marked as sent and retained for the configured retention period.

The business-state changes and corresponding outbox records must commit atomically.

**Never publish directly to RabbitMQ inside the retryable database transaction callback.** EF Core execution strategies may retry that callback, causing duplicate or inconsistent external effects.

## 5. Planned Inbound Flow

The intended inbound flow is:

1. A message arrives from the broker.
2. The consumer identifies the message and its contract.
3. The message is recorded in the inbox according to the established deduplication design.
4. The consumer executes the required application operation.
5. Processing state and business changes are committed atomically where they share a database.
6. Repeated delivery of the same message does not repeat the business effect.

The exact inbox schema, transaction boundary, dispatch mechanism, and failure states must be defined during implementation. Do not invent them when the repository does not yet contain an established design.

## 6. Delivery Guarantees and Idempotency

The intended model is at-least-once delivery with idempotent consumers.

Consequences:

- A message may be delivered more than once.
- Publishing a message and marking it as sent cannot generally be assumed to be one atomic operation across PostgreSQL and RabbitMQ.
- Consumers must prevent duplicate delivery from repeating business effects.
- Retries must not silently lose messages or corrupt business state.
- Failure handling and observability must make stuck or repeatedly failing messages detectable.

Do not claim exactly-once delivery merely because inbox/outbox tables are present.

## 7. Retention

The current plan is to retain processed inbox and successfully sent outbox records for seven days before cleanup.

Retention must not remove records still required for pending delivery, retries, deduplication, or operational investigation.

Cleanup must be implemented as a controlled background process and must follow the actual schema and processing states.

The seven-day period is a planned policy and should be configured according to the established project conventions rather than duplicated as unexplained magic values.

## 8. Domain-Event Handling and Unit of Work

Domain-event processing must preserve consistency with persistence.

When implementing event dispatch:

- Identify the tracked aggregate roots and their pending domain events.
- Process only events that belong to the operation being committed.
- Map domain events to integration contracts through dedicated handlers or mappings.
- Persist outbox records within the same transaction as business changes.
- Do not clear domain events prematurely.
- Make retry behavior safe.
- Avoid performing irreversible external side effects in the transaction callback.

Inspect the existing `IUnitOfWork` implementation before adding this behavior. Do not assume the currently commented or planned event-dispatching code is operational.

## 9. Message Contracts

Integration-event contracts must be explicit and stable.

- Do not serialize domain entities as integration events.
- Do not expose persistence models directly.
- Include only information required by consumers.
- Consider event identity, event type, schema evolution, and compatibility when defining the contract.
- Follow the existing contract naming and namespace conventions once established.

Do not introduce arbitrary versioning, envelope, or serialization abstractions without a concrete requirement and an agreed convention.

## 10. Implementation Checklist

Before implementing a messaging feature:

1. Confirm that the task explicitly requires messaging infrastructure.
2. Inspect existing Wolverine configuration and unit-of-work behavior.
3. Define the integration-event contract and its producer/consumer direction.
4. Establish the transaction boundary and idempotency mechanism.
5. Define retry and failure behavior.
6. Ensure business changes and outbox records are committed atomically.
7. Ensure consumers tolerate duplicate delivery.
8. Add integration tests for the relevant failure and retry scenarios.
9. Document any newly established conventions.
10. Do not report the planned flow as implemented until it has been verified.

## 11. Related Documentation

- Domain events and aggregate-root rules: `domain-modeling.md`.
- Handler and dispatching conventions: `application-flow.md`.
- Unit of work, transactions, and execution strategy: `persistence.md`.
