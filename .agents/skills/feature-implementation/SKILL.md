---
name: feature-implementation
description: Implement or extend backend features in BustHub Core.Features, following existing feature conventions, architectural boundaries, application flow, domain behavior, persistence abstractions, and error handling. Use when creating a new API feature or modifying an existing feature's use case.
---

# Feature Implementation

## Purpose

Implement backend features consistently with the existing BustHub architecture and conventions.

This skill covers feature-level implementation in `Core.Features` and coordination with the existing domain, application, HTTP, and persistence layers.

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
   - `messaging.md` when the task explicitly involves messaging
4. Inspect the relevant projects, existing feature implementations, and similar endpoints or handlers.
5. Inspect existing abstractions and their actual signatures before using them.

Do not assume a class, interface, registration method, project, or capability exists merely because it is mentioned in documentation.

## 2. Establish the Feature Scope

Before editing code, determine:

- The requested business behavior and acceptance criteria.
- Whether the operation is a command, a query, or both.
- The API endpoint and transport contracts required.
- Which domain entities, aggregate roots, and value objects are involved.
- Which application ports or persistence implementations are required.
- Whether the change requires transactional consistency.
- Which existing components can be reused.

Identify the owning project for every new or modified type.

If a business rule, authorization requirement, API contract, or architectural decision materially affects the implementation and remains unresolved, ask for clarification rather than inventing behavior.

Do not expand the feature into unrelated functionality.

## 3. Follow Project Responsibilities

Respect the established project boundaries:

- `Core.Features`: feature endpoints, commands, queries, handlers, HTTP request/response contracts, and feature-specific mapping definitions.
- `Core.Application`: application ports, repository abstractions, read-port interfaces and their projection types, Result abstractions, and unit-of-work contracts.
- `Core.Domain`: domain entities, aggregate roots, value objects, business invariants, and domain errors.
- `Adapters.Inbound.Http`: `IEndpoint`, shared HTTP infrastructure, endpoint discovery, middleware, HTTP error mapping, and shared Mapster integration.
- `Adapters.Outbound.Postgres`: EF Core, database queries, repository implementations, persistence mappings, and unit-of-work implementation.
- `Adapters.Wolverine`: Wolverine-specific internal handler dispatching.
- `Bootstrap.Api`: application composition and startup.

Preserve the established dependency rules, including the intentional `Core.Features` references to `Core.Application` and `Adapters.Inbound.Http`.

Never make `Adapters.Outbound.Postgres` depend on `Core.Features`.

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

### 4.4. Queries and Handlers

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

### 4.5. Mapping

- Keep shared Mapster registration in `Adapters.Inbound.Http`.
- Keep feature-specific mapping definitions with the corresponding feature in `Core.Features`.
- Follow the existing mapping registration and discovery mechanism.
- Reuse existing mappings when appropriate.
- Do not duplicate mapping logic unnecessarily.
- Do not use HTTP response DTOs as domain entities or persistence projections merely to avoid creating distinct types.

Inspect actual mapping configuration before adding or changing mappings.

### 4.6. Validation and Errors

- Follow the existing validation approach and layer boundaries.
- Perform primitive input validation in the appropriate HTTP/application validation layer.
- Enforce domain invariants in the domain model.
- Let value objects enforce constraints intrinsic to their values.
- Do not duplicate validation already performed by value objects or upstream validation.
- Represent expected failures using the existing Result and error abstractions.
- Use domain errors for domain-level failures.
- Leave HTTP status mapping to the inbound HTTP layer.
- Do not expose infrastructure exceptions as ordinary business errors.

Do not introduce a second validation or error-handling mechanism for the same use case.

### 4.7. Transactions and Side Effects

When a feature requires transactional consistency:

- Use the established `IUnitOfWork` contract and transaction mechanism.
- Respect transaction ownership and avoid independently committing an outer transaction.
- Account for EF Core execution-strategy retries.
- Do not perform external side effects inside retryable database transaction callbacks.
- Do not introduce messaging, outbox/inbox processing, or external integrations unless explicitly required and sufficiently designed.

Follow `docs/backend/persistence.md` and `docs/backend/messaging.md` when relevant.

## 5. Configuration and Dependencies

- Reuse existing dependency injection and application composition mechanisms.
- Place registrations in the project that owns the integration.
- Follow established constants and configuration conventions.
- Avoid magic strings and duplicated configuration values when named constants are appropriate.
- Do not add packages or infrastructure without concrete justification.
- Do not add feature-specific registrations if the existing assembly-scanning mechanism already discovers the relevant types.

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
- [ ] Domain invariants and validation boundaries are preserved.
- [ ] Commands and queries use the correct application and persistence paths.
- [ ] Mapping, error handling, and transactions follow established conventions.
- [ ] No unrequested projects, packages, infrastructure, or integrations were introduced.
- [ ] Relevant available verification commands were run and their results inspected.
- [ ] Documentation was updated if an architectural rule or established convention changed.

In the final report, summarize the implementation, important design decisions, verification results, and known limitations.

If a requirement could not be implemented without an unresolved business or architectural decision, explain the issue and ask for clarification instead of silently choosing a behavior.