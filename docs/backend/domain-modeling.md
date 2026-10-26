# Domain Modeling Rules

This document defines the rules for creating and modifying domain models in BustHub. Follow it whenever a task introduces or changes entities, aggregate roots, value objects, domain behavior, or domain events.

## 1. Ownership

Domain types belong in `Core.Domain`, unless an existing shared abstraction belongs in `Core.Abstractions`.

- `Core.Abstractions` contains small, reusable contracts and primitives.
- `Core.Domain` contains business concepts, state, invariants, and domain behavior.
- `Core.Application` contains application orchestration and application-facing ports.
- `Core.Features` contains use-case-specific handlers and transport contracts.
- Infrastructure implementations must not be moved into the domain.

Do not add HTTP, EF Core, PostgreSQL, Wolverine, or broker-specific dependencies to domain types.

## 2. Entity Conventions

All domain entity classes:

- Have the `Entity` suffix.
- Are declared `sealed`.
- Inherit from the appropriate established base class.
- Protect their invariants through constructors, factories, and behavior methods.
- Do not expose unrestricted mutation when that mutation could violate an invariant.

Use `EntityBase<T>` for a simple entity.

Use `AggregateRootBase<T>` when the type is an aggregate root responsible for protecting a consistency boundary and, where applicable, collecting domain events.

Do not choose an aggregate root merely because an entity has many properties or is referenced by other entities. Identify which state must remain consistent within one domain operation.

Inspect the actual base-class constructors, identity behavior, and domain-event APIs before implementing a new type. Do not invent alternative base classes or duplicate functionality already provided by the existing abstractions.

## 3. Construction and Encapsulation

Use the existing project conventions for constructors and factories.

- Provide the constructor required by EF Core when the current persistence mapping requires it.
- Keep persistence-only construction separate from public domain creation where necessary.
- Initialize non-nullable reference properties consistently with existing entities and EF Core conventions.
- Prevent callers from constructing invalid domain states through public constructors or unrestricted setters.
- Expose behavior through methods when state transitions have business meaning.

A private EF Core constructor may initialize required non-nullable properties with `null!` when the persistence materialization process populates them. Do not use this as a reason to allow invalid state through public domain APIs.

Do not introduce a factory abstraction for every entity automatically. Use the simplest construction mechanism that fits the domain rules and established conventions.

## 4. Business Invariants and Validation

Validate business invariants in the domain model.

Examples include:

- A state transition is permitted only from certain current states.
- An operation cannot consume more funds than the domain rules allow.
- An entity cannot enter a terminal state twice if the business rules prohibit it.
- Related entities must satisfy the consistency requirements of their aggregate.

Distinguish three kinds of validation:

1. **Transport/input validation:** malformed input, missing request fields, string length limits, and other API constraints. Perform this in the established HTTP/application validation layer.
2. **Value-object invariants:** constraints intrinsic to a value, such as a positive monetary amount when positivity is part of the value object's meaning. Enforce these inside the value object.
3. **Domain invariants:** business rules governing valid state and operations. Enforce these in the domain model.

Do not duplicate primitive validation already performed upstream or by a value object. However, never rely exclusively on HTTP validation for an invariant that must remain true regardless of how the domain is called.

Do not add validation solely because it is technically possible. Establish that the rule is required by the domain.

## 5. Value Objects

Use value objects for concepts whose identity is defined by their values rather than a separate entity identity.

A value object should:

- Represent one meaningful domain concept.
- Enforce its intrinsic invariants.
- Use the project's established equality and immutability conventions.
- Avoid infrastructure dependencies.
- Avoid duplicating validation that belongs to an upstream boundary.

Do not create a value object for every primitive automatically. Introduce one when it expresses a meaningful concept, protects an invariant, or prevents invalid combinations of values.

Before creating a value object, inspect existing value objects and their base types to reuse the project's conventions.

## 6. Aggregate Boundaries

An aggregate root controls changes that must preserve consistency within its aggregate.

When modeling relationships:

- Prefer references by identity between aggregates when appropriate.
- Do not load or mutate another aggregate merely to bypass its own behavioral rules.
- Do not treat every navigation property as proof that two entities belong to the same aggregate.
- Keep transaction and concurrency requirements in mind when choosing the consistency boundary.
- Use application services or handlers to coordinate operations across aggregates when the behavior does not belong to one aggregate.

Do not create an aggregate root solely to make repository access convenient.

## 7. Domain Events

Domain events represent meaningful occurrences inside the domain.

- Domain events must use the existing domain-event abstractions.
- Create domain events through aggregate-root behavior.
- Do not allow arbitrary handlers, endpoints, or repositories to fabricate events that claim a domain operation occurred.
- Keep domain events independent of HTTP, database schemas, and broker-specific contracts.
- Do not put integration-event transport contracts into `Core.Domain`.

Event dispatching and persistence integration must follow the application's established unit-of-work conventions. The future Outbox flow is described in `messaging.md`; do not assume it is implemented.

Do not clear domain events before the corresponding event-handling work has completed successfully according to the established implementation.

## 8. Domain Errors

Use the established domain error abstractions and error codes.

- Domain errors describe business-level failure conditions.
- Do not couple them to HTTP response types or status codes.
- Do not add a `Message` property to domain exceptions when the established convention intentionally represents failures through error information and codes.
- Use the existing domain exception/result conventions rather than creating a second mechanism.

Inspect the existing error types before adding new ones.

## 9. Entity Implementation Procedure

When creating or changing a domain entity:

1. Identify its business responsibility and consistency boundary.
2. Decide whether it is a simple entity or an aggregate root.
3. Inspect the relevant base class and similar existing entities.
4. Identify required state, allowed transitions, and invariants.
5. Decide which values should be represented by existing or new value objects.
6. Implement creation and state changes without unrestricted mutation.
7. Add domain events only when a meaningful domain occurrence requires them.
8. Update persistence configuration if the model changes.
9. Add tests for invariants and state transitions.
10. Verify that validation has not been duplicated across layers.

Do not invent business rules when requirements are missing. Ask for clarification when a missing rule materially affects valid state, money movement, authorization, or lifecycle transitions.

## 10. Testing

Test domain behavior independently of PostgreSQL, HTTP, and external services.

Prioritize tests for:

- Valid creation.
- Invalid construction.
- Allowed and forbidden state transitions.
- Boundary conditions relevant to business invariants.
- Value-object equality and validation where applicable.
- Domain events produced by successful operations and not produced by rejected operations.

Follow the existing test-project and assertion conventions.

## 11. Related Rules

- Application flow and handler responsibilities: `application-flow.md`.
- Persistence mapping and transaction behavior: `persistence.md`.
- Error mapping: `error-handling.md`.
- Future event publication and delivery: `messaging.md`.
