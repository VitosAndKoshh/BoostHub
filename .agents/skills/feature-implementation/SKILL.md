---
name: feature-implementation
description: Implement or extend backend features in BoostHub Core.Features, following the current architecture, feature conventions, application flow, domain behavior, persistence abstractions, Wolverine dispatching, transaction ownership, and error handling. Use when creating a new API feature or modifying an existing feature's use case.
---

# Feature Implementation

## Purpose

Implement backend features consistently with the established BoostHub architecture and conventions.

This skill covers feature-level implementation in `Core.Features` and coordination with the existing domain, application, HTTP, security, and persistence layers.

It does not authorize unrelated architectural changes or override `AGENTS.md`, `architecture.md`, or repository-specific instructions.

## 1. Read the Relevant Context

Before implementing a feature:

1. Follow the repository's `AGENTS.md` instructions.
2. Read `architecture.md`.
3. Read the relevant documentation under `docs/backend/`, particularly:
   - `application-flow.md`
   - `domain-modeling.md` when domain behavior is involved
   - `persistence.md` when repositories, read ports, or transactions are involved
   - `error-handling.md` when handling errors or operation results
   - `messaging.md` when the task explicitly involves messaging or handler composition
4. Inspect the relevant projects, existing feature implementations, and similar endpoints or handlers.
5. Inspect existing abstractions, implementations, dependency registrations, and their actual signatures before using them.

Do not assume a class, interface, registration method, project, or capability exists merely because it is mentioned in documentation.

When documentation and implementation disagree, inspect the actual code and identify the discrepancy. Follow the established implementation unless an architectural change is explicitly requested or approved.

## 2. Establish the Feature Scope

Before editing code, determine:

- The requested business behavior and acceptance criteria.
- Whether the operation is a command, a query, or both.
- The API endpoint and transport contracts required.
- Which domain entities, aggregate roots, and value objects are involved.
- Which application ports or persistence implementations are required.
- Whether the operation participates in an existing transaction or requires its own transaction.
- Whether the use case composes or invokes other handlers.
- Which existing components can be reused.

Identify the owning project for every new or modified type.

If a business rule, authorization requirement, API contract, transaction boundary, or architectural decision materially affects the implementation and remains unresolved, ask for clarification rather than inventing behavior.

Do not expand the feature into unrelated functionality.

## 3. Follow Project Responsibilities

Respect the established project boundaries:

- `Core.Features`: feature endpoints, commands, queries, handlers, validators, HTTP request/response contracts, and feature-specific mapping definitions.
- `Core.Application`: application ports, repository abstractions, read-port interfaces and their projection types, Result abstractions, unit-of-work contracts, security abstractions, and the established Wolverine application integration.
- `Core.Domain`: domain entities, aggregate roots, value objects, business invariants, domain events, and domain errors.
- `Adapters.Inbound.Http`: `IEndpoint`, Minimal API infrastructure, endpoint discovery, middleware, HTTP error mapping, and shared Mapster integration.
- `Adapters.Outbound.Postgres`: EF Core, database queries, repository implementations, persistence mappings, and unit-of-work implementation.
- `Adapters.Outbound.Security`: implementations of security abstractions, including JWT generation and password hashing.
- `Bootstrap.Api`: application composition, dependency registration orchestration, and startup pipeline.

Preserve the established dependency rules, including the intentional `Core.Features` references to `Core.Application` and `Adapters.Inbound.Http`.

Never make `Adapters.Outbound.Postgres` depend on `Core.Features`.

Do not introduce a separate Wolverine adapter or `IMessageDispatcher` abstraction. Wolverine is used directly as the established application dispatch foundation through the existing integration in `Core.Application`.

Do not move Wolverine integration into a new project or introduce another dispatch abstraction unless an architectural change is explicitly requested and approved.

Do not introduce new projects or project references unless the task requires an architectural change and that change is sufficiently established or explicitly approved.

## 4. Implement the Feature

### 4.1. Reuse Existing Conventions

Find the closest existing feature and follow its established:

- Folder and namespace structure.
- Naming conventions.
- Endpoint and handler patterns.
- Request and response contract conventions.
- Command/query dispatching mechanism.
- Mapping approach.
- Dependency injection and assembly discovery mechanisms.
- Validation and error conventions.

Do not create a parallel implementation style when an existing convention already satisfies the requirement.

Do not assume every feature needs a command, query, handler, mapper, or additional abstraction. Add only the components required by the use case.

### 4.2. Endpoint and Transport Contracts

- Follow the existing `IEndpoint` implementation convention.
- Keep HTTP-specific concerns in the endpoint and inbound HTTP layer.
- Keep request and response contracts appropriate to the API boundary.
- Delegate application behavior to the established command/query dispatching mechanism.
- Do not put business logic, database access, or transaction management directly in endpoints.
- Preserve existing API versioning, route, validation, and response conventions.

Do not introduce controllers or another endpoint framework in place of the established Minimal API approach.

### 4.3. Commands and Handlers

For state-changing operations:

- Represent the use case using the established command and handler conventions.
- Apply business changes through domain entities and aggregate roots.
- Preserve domain invariants and encapsulation.
- Use application-facing repositories and `IUnitOfWork` where appropriate.
- Use the established transaction mechanism when transactional consistency is required.
- Return results using the existing Result abstractions.
- Avoid putting HTTP-specific behavior into application or domain code.

Do not inject `DbContext` directly into feature handlers.

Do not bypass domain behavior by directly modifying persistence state when an aggregate or domain operation should enforce the relevant invariant.

Do not add dependencies to a handler that it does not actually use.

### 4.4. Handler Composition and Wolverine

Use the existing Wolverine integration and dispatching conventions when one feature use case needs to invoke another handler.

Before composing handlers:

1. Determine whether the invoked operation is an independent use case or an internal part of a larger use case.
2. Inspect how existing handlers dispatch commands or queries.
3. Determine whether the invoked handler participates in the caller's transaction.
4. Verify the DI lifetimes and whether both handlers use the same scoped persistence context.
5. Preserve the established Result propagation behavior.

When a handler invokes another handler through Wolverine:

- Do not assume that the nested handler automatically owns an independent transaction.
- Do not create a second transaction or independently commit an outer transaction.
- Do not assume that invoking a handler automatically persists its changes.
- Follow the actual `IUnitOfWork` and repository implementation.
- Propagate cancellation tokens through nested dispatches and persistence operations.
- Propagate expected failures using the existing Result abstractions.

Avoid using handler dispatch merely to split a few lines of implementation into another class. Use it when the invoked operation represents a meaningful use case or reusable application operation.

Do not introduce a generic mediator, dispatcher, or additional messaging abstraction alongside the existing Wolverine integration.

### 4.5. Queries and Handlers

For read operations:

- Use the established query and handler conventions.
- Use application-facing read ports for database reads.
- Place read-port interfaces and their returned projection types in `Core.Application`.
- Implement database queries in `Adapters.Outbound.Postgres`.
- Keep feature-specific HTTP contracts in `Core.Features`.
- Use purpose-specific projections rather than loading full aggregates when unnecessary.
- Prefer a single database query where practical.

Do not create a universal repository, introduce a separate read store, or add a read-model project for a feature without an established architectural requirement.

Do not make the PostgreSQL adapter reference feature-specific DTOs or handlers.

### 4.6. Mapping

- Keep shared Mapster registration in `Adapters.Inbound.Http`.
- Keep feature-specific mapping definitions with the corresponding feature in `Core.Features`.
- Follow the existing mapping registration and discovery mechanism.
- Reuse existing mappings when appropriate.
- Do not duplicate mapping logic unnecessarily.
- Do not use HTTP response DTOs as domain entities or persistence projections merely to avoid creating distinct types.

Inspect actual mapping configuration before adding or changing mappings.

### 4.7. Validation and Errors

- Follow the existing validation approach and layer boundaries.
- Perform primitive input validation in the appropriate HTTP/application validation layer.
- Enforce domain invariants in the domain model.
- Let value objects enforce constraints intrinsic to their values.
- Do not duplicate validation already performed by value objects or upstream validation.
- Represent expected failures using the existing Result and error abstractions.
- Use domain errors for domain-level failures.
- Leave HTTP status mapping to the inbound HTTP layer.
- Do not expose infrastructure exceptions as ordinary business errors.

When adding FluentValidation rules:

- Follow the existing validator registration and execution mechanism.
- Use established error codes rather than inventing arbitrary strings.
- Ensure error codes and messages correspond to the actual rule that failed.
- Consider the underlying type's semantics. For example, enum validation should verify that a value is a declared enum member; do not assume that `NotEmpty()` is sufficient for a non-nullable enum.
- Avoid redundant rules when an existing domain type or validator already guarantees the constraint.

Do not introduce a second validation or error-handling mechanism for the same use case.

### 4.8. Transactions and Side Effects

When a feature requires transactional consistency:

- Use the established `IUnitOfWork` contract and transaction mechanism.
- Respect transaction ownership and avoid independently committing an outer transaction.
- Inspect the actual `UnitOfWorkBase` implementation before changing transaction behavior.
- Account for EF Core execution-strategy retries.
- Do not perform external side effects inside retryable database transaction callbacks.
- Do not introduce messaging infrastructure, outbox/inbox processing, or external integrations unless explicitly required and sufficiently designed.

The current unit-of-work implementation has specific nested transaction behavior:

- An outer operation owns the transaction, persistence, commit, and rollback.
- When an active transaction already exists, a nested unit-of-work operation executes within that transaction rather than creating and committing another one.
- The nested operation does not independently call `SaveChanges` or commit the outer transaction.
- Changes made by nested handlers and repositories must be persisted by the outer transaction owner.

Verify these assumptions against the current implementation before relying on them. Do not silently change transaction ownership or persistence semantics.

Do not assume that a repository call alone commits changes. Inspect its implementation and the surrounding unit-of-work flow.

Follow `docs/backend/persistence.md` and `docs/backend/messaging.md` when relevant.

## 5. Configuration and Dependencies

- Reuse existing dependency injection and application composition mechanisms.
- Place registrations in the project that owns the integration.
- Follow established constants and configuration conventions.
- Avoid magic strings and duplicated configuration values when named constants are appropriate.
- Do not add packages or infrastructure without concrete justification.
- Do not add feature-specific registrations if the existing assembly-scanning mechanism already discovers the relevant types.
- Do not introduce redundant abstractions for dependencies already provided by the established application integration.

Do not modify the composition root or project references unnecessarily.

## 6. Documentation and Testing

Update documentation when the feature changes an architectural rule, established convention, or documented workflow.

Do not duplicate documentation for ordinary implementation details that are already clear from the code.

Automated testing is deferred until after the MVP:

- Do not create test projects or add automated tests unless explicitly requested.
- Do not treat the absence of tests as a defect.
- Use available build, static-analysis, and validation tooling as appropriate and permitted.
- Do not run infrastructure operations without the approval required by `AGENTS.md`.

Do not claim that a check succeeded unless its result was actually inspected.

## 7. Final Review

Before reporting completion, verify the following:

- [ ] The implementation satisfies the requested behavior without adding unrelated functionality.
- [ ] Types reside in the correct projects.
- [ ] Project dependencies follow the established architecture.
- [ ] Existing conventions and abstractions have been reused where appropriate.
- [ ] No obsolete project or abstraction has been introduced.
- [ ] Domain invariants and validation boundaries are preserved.
- [ ] Commands and queries use the correct application and persistence paths.
- [ ] Nested handler calls follow the established dispatching and transaction ownership rules.
- [ ] Mapping, error handling, and transactions follow established conventions.
- [ ] Cancellation tokens are propagated where supported.
- [ ] No unrequested projects, packages, infrastructure, or integrations were introduced.
- [ ] Relevant available verification commands were run and their results inspected.
- [ ] Documentation was updated if an architectural rule or established convention changed.

In the final report, summarize the implementation, important design decisions, verification results, and known limitations.

If a requirement could not be implemented without an unresolved business or architectural decision, explain the issue and ask for clarification instead of silently choosing a behavior.