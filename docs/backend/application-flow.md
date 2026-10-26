# Application Flow and Feature Implementation

This document defines how to implement backend use cases in BustHub. Follow it when adding an HTTP endpoint, command, query, handler, mapping, or application operation.

## 1. Core Rules

The backend uses ASP.NET Core Minimal APIs, feature-oriented organization, Wolverine for internal handler dispatching, Mapster for mapping integration, and Light CQRS.

- Endpoints handle HTTP concerns.
- Handlers implement application use cases.
- Domain entities enforce business invariants.
- Application ports define dependencies on persistence and other capabilities.
- Infrastructure adapters implement those ports.
- `Bootstrap.Api` composes the application.

Do not place an entire business workflow inside an endpoint, and do not let handlers depend directly on infrastructure implementations.

## 2. Where Types Belong

| Type | Location |
|---|---|
| HTTP endpoint | Relevant feature in `Core.Features` |
| HTTP request/response contract | Relevant feature in `Core.Features` |
| Command | Relevant feature in `Core.Features` |
| Query | Relevant feature in `Core.Features` |
| Command/query handler | Relevant feature in `Core.Features` |
| Feature-specific mapping definition | Relevant feature in `Core.Features` |
| Domain entity/value object | `Core.Domain` |
| Application-facing port | `Core.Application` |
| Read projection returned by a read port | `Core.Application`, alongside the port |
| PostgreSQL repository/read-query implementation | `Adapters.Outbound.Postgres` |
| Shared endpoint contract and HTTP infrastructure | `Adapters.Inbound.Http` |
| Wolverine integration and dispatching registration | `Adapters.Wolverine` |
| Application composition | `Bootstrap.Api` |

Follow existing feature folder and naming conventions. Do not create additional projects or folders solely to match an imagined template.

## 3. Implementing a New Use Case

Before coding:

1. Find a similar existing use case and inspect its endpoint, operation, handler, mappings, and tests.
2. Determine whether the operation reads data or changes business state.
3. Identify the relevant domain entities or read ports.
4. Identify the required application abstractions.
5. Determine the validation and error-handling conventions.
6. Confirm that any missing business rules are resolved.

Then implement the smallest complete use case using the existing project conventions.

A feature does not need every possible layer or type. Add only what the use case requires.

## 4. HTTP Endpoints

Endpoints are Minimal API endpoint classes implementing the shared `IEndpoint` contract.

- Keep HTTP-specific responsibilities in the endpoint.
- Follow the existing route, versioning, binding, authorization, and response conventions.
- Validate transport input using the established validation approach.
- Dispatch the appropriate command or query using the existing Wolverine integration.
- Map application outcomes through the established HTTP response and error-handling mechanisms.
- Do not access `DbContext` directly from endpoints.
- Do not implement business state transitions inside endpoint methods.

Endpoint discovery and registration use the existing `MapEndpoints` assembly-scanning mechanism. Do not introduce a second endpoint registry or dispatch endpoints through Wolverine.

The `Core.Features` dependency on `Adapters.Inbound.Http` is an established architectural exception. Preserve it without spreading unrelated HTTP infrastructure through feature logic.

## 5. Commands and Write Handlers

Use a command for an operation that intends to change application or domain state.

A write handler should generally:

1. Receive the command through the existing dispatch mechanism.
2. Validate application-level requirements not already handled by the HTTP boundary.
3. Load the required domain entities or aggregate roots through application-facing abstractions.
4. Execute domain behavior through methods that preserve invariants.
5. Persist changes using the established repository and unit-of-work mechanisms.
6. Return the established result type.
7. Use the existing error-handling conventions for expected failures.

Not every command requires a new repository method or explicit transaction. Follow the actual consistency requirements and existing patterns.

Do not modify entity properties directly from a handler when a domain behavior method should control the transition.

Do not introduce distributed transactions, broker publication, or additional infrastructure into an ordinary command without an established requirement.

## 6. Queries and Read Handlers

Use a query for retrieving data without performing a business state transition.

A query handler should generally:

1. Receive the query through the existing dispatch mechanism.
2. Call the appropriate read port from `Core.Application`.
3. Receive a projection or collection appropriate to the use case.
4. Apply only the application-level orchestration required by the use case.
5. Return the established result/response shape.

Read handlers must not depend directly on `DbContext` or PostgreSQL implementation types.

Read-port interfaces and their returned projection types belong in `Core.Application`. PostgreSQL implementations belong in `Adapters.Outbound.Postgres`. Feature-specific HTTP response contracts remain in `Core.Features`.

Prefer database-side filtering, sorting, pagination, and projection when appropriate. Do not load complete aggregates merely to construct a list or details response.

Do not introduce a separate read database or a universal repository with unrelated query parameters.

## 7. Result and Error Flow

Use the project's existing Result pattern for expected operation outcomes.

- Return success through the established success representation.
- Represent expected business/application failures using existing error abstractions.
- Do not use exceptions as the default control flow for expected failures.
- Let the inbound HTTP layer translate results and exceptions into HTTP responses.
- Do not map HTTP status codes inside domain entities or application handlers.

Follow `error-handling.md` for detailed rules.

## 8. Mapping

Shared Mapster integration and registration belong in `Adapters.Inbound.Http`.

Feature-specific mapping definitions belong in their respective feature in `Core.Features`.

- Follow existing mapping conventions.
- Do not introduce duplicate mapping mechanisms for the same purpose.
- Do not hide business decisions inside mapping configuration.
- Do not map HTTP DTOs directly into domain entities if doing so bypasses constructors, factories, or behavior methods.
- Ensure mappings do not accidentally expose internal domain state.

Inspect the existing mappings and registration before adding new configuration.

## 9. Dependency Injection and Discovery

- `Bootstrap.Api` is the composition root.
- Adapter-specific registration belongs in the owning adapter.
- Wolverine registration is provided through `Adapters.Wolverine`.
- Endpoint registration uses the existing `MapEndpoints` assembly scanning.
- Do not create a feature-specific service locator or manually resolve dependencies inside handlers.
- Do not add a second registration path when an existing extension already owns the responsibility.

Only introduce new registration conventions when a concrete requirement cannot be met by the existing mechanism.

## 10. Testing

For a new use case, add or update tests appropriate to its behavior:

- Handler tests for application orchestration and result outcomes.
- Domain tests for business invariants and state transitions.
- Integration tests for persistence, transaction, or HTTP behavior that cannot be adequately verified in isolation.

Follow existing test-project conventions and avoid testing private implementation details unnecessarily.

## 11. Implementation Checklist

Before completing a feature, verify:

- The endpoint, command/query, and handler are in the appropriate feature.
- Domain behavior is implemented in the correct domain type.
- Persistence is accessed through application-facing abstractions.
- Read projections are owned by `Core.Application`.
- No forbidden project dependency was introduced.
- Existing error handling and mapping conventions are preserved.
- Relevant tests were added or updated.
- Build and test results were checked.
- Documentation was updated if an architectural rule changed.

## 12. Related Documentation

- Domain entities and invariants: `domain-modeling.md`.
- Repositories, EF Core, transactions, and migrations: `persistence.md`.
- Result and HTTP error mapping: `error-handling.md`.
- Future integration messaging: `messaging.md`.
