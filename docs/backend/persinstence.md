# Persistence and Transactions

This document defines the persistence boundaries and implementation rules for BustHub.

## 1. Current Persistence Architecture

The backend uses EF Core and PostgreSQL.

Persistence implementation belongs in `Adapters.Outbound.Postgres`. Application-facing abstractions belong in `Core.Application`. Domain types belong in `Core.Domain`.

The `Migrations` project contains EF Core migrations and design-time tooling. `Bootstrap.Api` composes the application at startup.

The application uses Light CQRS with one database:

- Write operations use the domain model and persistence abstractions.
- Read operations use read ports and projections.
- No separate read database or synchronization pipeline is currently used.

## 2. Ownership Rules

| Concern | Owner |
|---|---|
| Repository and persistence ports | `Core.Application` |
| Read-port interfaces | `Core.Application` |
| Projection types returned by read ports | `Core.Application` |
| Unit-of-work contract | `Core.Application` |
| EF Core `DbContext` | `Adapters.Outbound.Postgres` |
| EF Core entity configurations | `Adapters.Outbound.Postgres` |
| Repository implementations | `Adapters.Outbound.Postgres` |
| PostgreSQL read-query implementations | `Adapters.Outbound.Postgres` |
| Unit-of-work implementation | `Adapters.Outbound.Postgres` |
| EF Core migrations and design-time factory | `Migrations` |
| Dependency composition | `Bootstrap.Api` and owning adapter registration extensions |

The PostgreSQL adapter must not reference `Core.Features`.

Do not place HTTP response DTOs in persistence contracts. Read-port projections are application-facing results of database queries, not HTTP transport contracts.

## 3. Repository Responsibilities

Use repository abstractions for operations that benefit from a domain-oriented persistence boundary, especially write-side aggregate retrieval and persistence.

- Keep repository interfaces in `Core.Application`.
- Implement them in `Adapters.Outbound.Postgres`.
- Keep EF Core and PostgreSQL details in the implementation.
- Do not expose `DbContext`, EF Core entity entries, or provider-specific types through application ports.
- Do not create one repository method for every possible query without a concrete use case.
- Do not create a universal repository with many unrelated parameters.

A repository is not a requirement for every table. Choose abstractions based on actual use cases and consistency boundaries.

## 4. Read Ports and Projections

Read queries should retrieve the data required by a use case without unnecessarily materializing complete domain aggregates.

Read-port interfaces and the projection types they return belong together in `Core.Application`.

PostgreSQL implements these interfaces in `Adapters.Outbound.Postgres`.

Rules:

- Define projections around real query scenarios.
- Allow a projection to combine fields from multiple tables when needed.
- Allow different projections for list, detail, administrative, or other distinct scenarios.
- Perform filtering, ordering, pagination, joins, and projection in the database where appropriate.
- Prefer a single database query where practical.
- Avoid loading entities and mapping them into a projection when a direct database projection is sufficient.
- Do not make the persistence adapter depend on feature-specific response DTOs.
- Do not create a separate read-model project without a concrete architectural reason.

Do not create a read repository for every domain entity automatically. Organize ports around the required read operations and relevant subject areas.

Read handlers belong in `Core.Features` and must not inject `DbContext`.

## 5. EF Core Entity Configurations

Entity mapping belongs in the established entity-configuration structure in `Adapters.Outbound.Postgres`.

When changing a domain model or its persistence representation:

1. Inspect the current entity configuration.
2. Follow existing table, column, key, index, relationship, and conversion conventions.
3. Preserve domain encapsulation rather than adding public setters solely to simplify mapping.
4. Configure value-object persistence using the existing project's approach.
5. Add or update indexes and constraints when required by established data-integrity requirements.
6. Generate and inspect the appropriate migration when the database schema changes.
7. Verify that model configuration and migration output agree.

Do not invent a new mapping strategy for one entity when an established strategy already supports the requirement.

Database constraints complement domain validation; they do not replace the need to protect domain invariants.

## 6. Unit of Work

The application-facing `IUnitOfWork` contract belongs in `Core.Application`. Its EF Core implementation belongs in `Adapters.Outbound.Postgres`.

Follow the existing unit-of-work API rather than introducing direct transaction management into handlers.

The current implementation provides `SaveChangesAsync` and `ExecuteInTransactionAsync` overloads for operations with and without a return value.

The established transaction behavior is:

- The execution strategy wraps the transaction operation.
- If an existing EF Core transaction is active, the nested operation participates in it and does not independently commit it.
- Otherwise, the operation creates a transaction, executes the callback, saves changes, and commits.
- On failure, the owned transaction is rolled back and the failure is propagated.

Inspect the actual implementation before changing these semantics.

Do not make nested operations commit an outer transaction. Do not introduce a second unit-of-work abstraction without a concrete need.

## 7. Execution Strategy and Retry Safety

EF Core execution strategies may retry the transaction callback.

Therefore:

- Assume the callback can execute more than once.
- Keep callback operations retry-safe.
- Do not send emails, publish broker messages, call external payment APIs, or perform other irreversible external side effects inside the retryable callback.
- Avoid generating externally visible effects that can be duplicated when a database operation is retried.
- Use an established idempotency mechanism where repeated execution could otherwise cause incorrect state.

External effects that must follow a successful database commit require an appropriate reliable-delivery mechanism. The planned outbox design is documented in `messaging.md`; do not assume it exists until the implementation is present.

## 8. Domain Events and Persistence

Domain-event dispatching through the unit-of-work is a planned capability and must not be assumed to be implemented.

When implementing it:

- Collect domain events from the relevant tracked aggregate roots.
- Dispatch/map events according to the established domain-event handling design.
- Persist any outbox records in the same transaction as the business state changes.
- Do not publish directly to RabbitMQ inside the transaction callback.
- Do not clear events before the corresponding handling and persistence work has succeeded according to the design.
- Make the implementation safe under execution-strategy retries.

Follow `messaging.md` for the intended outbox/inbox architecture.

## 9. Migrations

The `Migrations` class library owns EF Core migrations and the design-time `DbContext` factory.

When changing the schema:

1. Inspect the migration project and its configuration.
2. Confirm the correct startup project, target project, and connection configuration.
3. Use the established EF Core migration workflow.
4. Inspect the generated migration and model snapshot.
5. Verify that the migration represents the intended schema change.
6. Do not apply migrations to a database unless the task and the applicable tool-permission rules authorize it.

Migration commands depend on the working directory, project paths, and explicit EF CLI arguments. Do not assume that a command uses the directory containing a script or project file as its working directory.

Keep migration connection settings separate from ordinary application configuration where the existing setup requires it. Never commit credentials or secrets.

## 10. Transactions and Business Operations

Choose transaction boundaries according to business consistency requirements.

Use a transaction when several database changes must succeed or fail together. Do not wrap every read or every simple operation in an unnecessary explicit transaction.

For money movement, wallet balances, transfers, holds, and order settlement, verify the business invariants, concurrency requirements, and transaction boundaries before implementing the operation. Do not infer financial semantics from class names alone.

Ask for clarification if the required atomicity, allowed state transitions, or failure behavior is not specified.

## 11. Testing

Test persistence behavior at the appropriate level.

- Unit tests verify domain behavior without a database.
- Integration tests verify EF Core mappings, query behavior, transaction semantics, and PostgreSQL-specific behavior where relevant.
- Test concurrent or retry-sensitive operations when they are important to correctness.
- Verify that migrations and model configuration remain consistent.

Use the existing test infrastructure. Do not replace a required PostgreSQL integration test with a mock that cannot verify database behavior.

## 12. Related Documentation

- Domain invariants and entity conventions: `domain-modeling.md`.
- Handler and query implementation: `application-flow.md`.
- Error propagation: `error-handling.md`.
- Outbox/inbox and reliable delivery: `messaging.md`.
