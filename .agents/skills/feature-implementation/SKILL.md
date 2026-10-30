---
name: feature-implementation
description: Implement or extend backend features in BoostHub Core.Features, following the current architecture, feature conventions, application flow, domain behavior, persistence abstractions, Wolverine dispatching, transaction ownership, and error handling. Use when creating a new API feature or modifying an existing feature's use case.
---

# Feature Implementing

## Purpose

This skill defines how to implement backend features in BoostHub.

The objective is to deliver complete, maintainable, production-minded features that follow the established architecture and project conventions.

A feature must not be reduced to the smallest implementation that merely makes its primary operation work.

A successful happy path is necessary, but it is not sufficient. Implement the relevant validation, error handling, logging, persistence behavior, domain rules, and edge cases required for a complete feature.

The goal is appropriate implementation quality, not maximum code volume or unnecessary abstraction.

## 1. Context and Preparation

Before implementing a feature:

1. Read the repository's `AGENTS.md`, `README.md`, and `architecture.md` if they have not already been reviewed in the current task or may have changed.
2. Identify and read the relevant backend documentation.
3. Read this skill and any other directly relevant skills.
4. Inspect the existing implementation patterns in the affected feature and neighboring features.
5. Inspect the relevant domain entities, application ports, repository implementations, validators, DI registrations, and persistence configurations.
6. Identify the complete execution flow and the architectural boundaries involved.

### Avoiding redundant inspection

- Reuse information already obtained during the current task.
- Do not reread documents or reinspect files whose contents are already known and remain relevant.
- Do not repeat successful builds or verification commands when no relevant code has changed.
- Revisit previously inspected files only when a dependency, requirement, or implementation detail makes it necessary.
- Prefer targeted inspection over exploring unrelated parts of the repository.

Do not start implementation if a material architectural decision is unclear. Ask for clarification rather than inventing requirements or silently choosing a design that changes established conventions.

## 2. Feature Design

Before writing code, understand the feature as a complete application use case.

Identify:

- Its purpose and expected behavior.
- Its entry point (HTTP endpoint, message, scheduled operation, or another trigger).
- Its command or query.
- Its handler and required dependencies.
- Its input validation requirements.
- Its domain operations and invariants.
- Its application ports and persistence requirements.
- Its expected success result.
- Its possible failure scenarios.
- Its transaction boundaries.
- Its logging and observability requirements.
- Its interaction with other features, if applicable.

Do not assume every feature requires every component. For example, a read-only query may not need a transaction, while a command with no externally supplied input may not need a dedicated validator.

Choose components according to actual responsibilities.

Before implementation, make sure the proposed design respects the existing dependency direction and does not introduce unnecessary project references or circular dependencies.

## 3. Implementation Quality

Implement complete features rather than minimal happy-path solutions.

### 3.1 Validation

Use FluentValidation for appropriate application input validation.

Consider:

- Required values.
- Empty or whitespace-only strings.
- String length and format constraints.
- Numeric ranges.
- Enum validity.
- Collection constraints.
- Cross-field validation.
- Other relevant input constraints.

Validation should happen at the appropriate application boundary, before executing the use case.

Rules:

- Do not rely exclusively on domain factories to validate all incoming application input.
- Do not duplicate domain invariants unnecessarily in validators.
- Do not use validators as a replacement for domain integrity.
- Do not add validators that provide no meaningful validation.
- Use established error codes and validation conventions.
- Follow existing Wolverine and FluentValidation integration.

A validator must provide meaningful feedback and use the project's established error-code conventions.

### 3.2 Logging and Observability

Use structured logging through `ILogger<T>` where logging provides meaningful operational value.

Consider logging:

- Important application operations.
- Significant state transitions.
- Expected business-operation failures when operationally useful.
- Unexpected failures.
- Missing or inconsistent application state.
- Important integration or persistence failures.

Logging should:

- Include useful contextual identifiers when available, such as AccountId, UserId, OrderId, or other relevant entity identifiers.
- Use structured message templates rather than string interpolation.
- Use appropriate log levels.
- Avoid logging the same failure repeatedly at multiple layers.
- Avoid logging expected business outcomes as errors.
- Never expose passwords, password hashes, access tokens, refresh tokens, secrets, or other sensitive information.

Do not add meaningless logs merely to make a handler appear complete.

If a lower-level component already logs an exception and the upper layer only propagates the failure, avoid redundant logging.

### 3.3 Error Handling

Use the established `Result` and error abstractions.

Rules:

- Represent expected business failures using appropriate application or domain errors.
- Preserve established error codes.
- Propagate failures from nested operations correctly.
- Do not silently ignore failed results.
- Do not convert meaningful errors into generic failures.
- Do not use exceptions for ordinary business control flow.
- Do not catch exceptions unless the current layer can meaningfully handle, translate, or enrich them.
- Do not swallow unexpected exceptions.
- Avoid redundant error handling when the established middleware or application infrastructure already handles the situation.

Consider relevant failure cases, including:

- Missing entities.
- Duplicate records.
- Invalid relationships.
- Invalid state transitions.
- Unauthorized operations.
- Conflicting operations.
- Persistence failures.
- Failed nested commands.

Do not invent new error abstractions or response formats when established conventions already cover the scenario.

### 3.4 Domain Integrity

Keep business rules in the domain model.

Rules:

- Use domain factories to create entities.
- Use domain methods to perform state changes.
- Preserve encapsulation.
- Respect aggregate boundaries.
- Enforce invariants in the domain model.
- Use value objects for concepts that have meaningful intrinsic constraints.
- Avoid exposing mutable collections or unrestricted setters.
- Do not bypass domain methods by directly manipulating entity state from handlers or repositories.
- Do not move business rules into HTTP endpoints, validators, or persistence configurations merely for convenience.

Application handlers coordinate use cases. They should not become containers for domain logic.

Do not introduce abstractions or domain concepts that are not justified by actual business requirements.

### 3.5 Persistence and Transactions

Follow the established persistence architecture.

Rules:

- Use application ports rather than depending directly on EF Core or PostgreSQL from application features.
- Use existing repositories and query abstractions where appropriate.
- Do not introduce generic repositories or universal abstractions without a concrete need.
- Respect entity relationships and aggregate boundaries.
- Ensure required uniqueness and referential integrity constraints are represented in persistence configuration.
- Do not assume application-level existence checks guarantee uniqueness under concurrent requests.
- Handle relevant persistence conflicts according to existing error conventions.

#### Transaction ownership

Understand which operation owns the transaction.

For nested application operations:

- The outer operation owns the transaction.
- Nested handlers must participate in the existing scoped persistence context.
- Nested handlers must not independently commit or create conflicting transactions.
- Nested handlers must not call `SaveChanges` when the established Unit of Work contract assigns persistence to the outer operation.
- Failures from nested operations must propagate to the outer operation.
- The outer operation must not report success if a required nested operation fails.

Do not perform external side effects inside retryable transaction callbacks unless the existing architecture explicitly guarantees safe execution.

Do not introduce unnecessary transactions for operations that do not require them.

### 3.6 Dependency Injection

Register new dependencies through the established DI conventions.

Rules:

- Place registrations in the project responsible for owning the implementation.
- Respect project boundaries.
- Use appropriate service lifetimes.
- Avoid duplicate registrations.
- Do not register services in unrelated projects merely for convenience.
- Ensure new repositories, validators, handlers, and infrastructure services are discoverable through the existing registration mechanisms.

Do not introduce service locators or manual service resolution as a substitute for proper dependency injection.

## 4. Application Flow and Wolverine

Follow the existing Wolverine integration.

Rules:

- Use the established command/query dispatch mechanism.
- Keep handlers focused on one application operation.
- Prefer explicit command and query types.
- Propagate `Result` values consistently.
- Respect cancellation tokens.
- Do not introduce a second dispatcher abstraction.
- Do not manually invoke handlers when the established architecture expects Wolverine dispatch.
- Do not create unnecessary nested commands when a direct domain operation or existing application abstraction is sufficient.

When one use case requires another application operation, determine whether it should be invoked through Wolverine based on the existing feature conventions and transaction requirements.

Do not split operations into multiple handlers merely to increase the number of classes.

Each handler should represent a meaningful application responsibility.

## 5. HTTP Endpoints and Contracts

When implementing an HTTP-facing feature, follow the existing Minimal API conventions.

Consider:

- Request and response contracts.
- Endpoint registration through `IEndpoint`.
- Correct HTTP methods and routes.
- API versioning conventions.
- Endpoint tags and OpenAPI metadata.
- Appropriate request validation.
- Correct mapping of application results to HTTP responses.
- Authentication and authorization requirements.
- Cancellation token propagation.

Rules:

- Keep endpoints thin.
- Do not implement business logic in endpoints.
- Do not expose domain entities directly as HTTP responses.
- Use established Mapster mapping conventions.
- Use the existing error-to-HTTP response mapping.
- Do not invent a new endpoint registration mechanism.
- Do not add authorization assumptions that are not supported by the current authentication and authorization implementation.

If an endpoint changes the public API contract, ensure its metadata accurately describes the behavior.

## 6. Feature Completeness Review

Before considering implementation complete, review the entire feature flow.

Use the following checklist as a review guide. Apply only the items relevant to the feature.

- [ ] The feature follows the established architecture and dependency rules.
- [ ] The application flow is complete, not limited to the happy path.
- [ ] Appropriate input validation exists.
- [ ] Domain invariants are enforced by the domain model.
- [ ] Expected failures are represented using established errors.
- [ ] Failed nested operations propagate correctly.
- [ ] Meaningful structured logging is present.
- [ ] Sensitive information is not logged.
- [ ] Persistence and transaction ownership are correct.
- [ ] Relevant uniqueness and relationship constraints are enforced.
- [ ] Cancellation tokens are propagated.
- [ ] Required services are registered correctly.
- [ ] HTTP contracts and metadata follow existing conventions, when applicable.
- [ ] No unnecessary abstractions, duplicated logic, or speculative functionality were introduced.

Do not mark an applicable requirement as complete merely because the happy path works.

If an item is not applicable, do not add code solely to satisfy the checklist.

## 7. Verification

After implementation:

1. Review the complete diff.
2. Check for accidental changes outside the requested scope.
3. Build the affected project or the narrowest relevant project set.
4. Review compiler output and resolve relevant errors and warnings introduced by the changes.
5. Verify that the implementation is consistent with the existing architecture and conventions.
6. Update relevant documentation only when the implementation changes documented behavior, architecture, or conventions.

Tests are currently deferred until the MVP is complete. Do not add or run tests unless explicitly requested.

Do not run Docker, Docker Compose, external services, or other restricted operations without explicit approval.

Avoid repeating successful verification when no relevant code has changed.

## 8. Scope Control

Quality does not mean implementing unrelated functionality.

Rules:

- Implement the requested feature completely within its intended scope.
- Do not silently expand the task into adjacent features.
- Do not introduce speculative future requirements.
- Do not refactor unrelated code.
- Do not add abstractions for hypothetical future use cases.
- Reuse existing infrastructure and conventions where appropriate.
- If a necessary architectural change exceeds the requested scope, explain why and ask before proceeding.

A smaller implementation is acceptable when it is genuinely sufficient. A deliberately incomplete implementation is not.

## 9. Completion Report

After implementation, provide a concise but informative report containing:

1. What was implemented.
2. Which important files or components were added or modified.
3. How the feature flow works.
4. How validation, error handling, and logging are handled.
5. How persistence and transaction ownership work, if applicable.
6. Any relevant architectural decisions or limitations.
7. Which verification commands were executed and their results.
8. Any remaining issues or decisions requiring user input.

Do not claim that something was verified if it was not.

Do not describe planned functionality as implemented.