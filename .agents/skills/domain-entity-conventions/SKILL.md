---
name: domain-entity-conventions
description: Use when creating, reviewing, or modifying domain entity classes in BustHub's Core.Domain. Defines entity naming, inheritance, construction, property mutability, factory validation, rich domain behavior, and EF Core compatibility.
---

# Domain Entity Conventions

Apply these conventions whenever creating or modifying a domain entity in `Core.Domain`.

## 1. Inspect the Existing Domain First

Before making changes:

- Inspect `EntityBase<>`, `AggregateRootBase<>`, and representative existing entities.
- Review the existing domain errors, `DomainException`, value objects, enums, identifier types, and factory patterns.
- Follow the actual signatures and conventions already present in the repository. Do not guess how base classes generate IDs, initialize timestamps, or expose domain events.
- Reuse existing abstractions where appropriate. Do not introduce duplicate base classes, error mechanisms, validation abstractions, or value objects.
- Keep the task scoped to the requested entity and changes strictly required for consistency.

If this skill appears to conflict with an established implementation or the requested business rules, inspect the code and explain the conflict instead of silently inventing a convention.

## 2. Naming and Class Shape

- Every domain entity class must have the `Entity` suffix, for example `BoostRequestEntity` or `OfferEntity`.
- Every domain entity class must be declared `sealed`, unless an existing framework constraint makes this impossible. Explain any exception.
- Value objects, enums, domain events, and other domain types are not entities and do not need the `Entity` suffix.
- Keep each entity in the existing domain folder and namespace convention for its domain concept.

## 3. Base Class Selection

- Inherit from `EntityBase<TId>` for an entity that does not need to emit domain events, using the actual generic signature and identifier type defined in the repository.
- Use `AggregateRootBase<TId>` only when the requested behavior explicitly requires the entity to act as an aggregate root and emit domain events, following the repository's actual aggregate-root conventions.
- No domain models currently need domain events by default. Do not inherit from `AggregateRootBase<>` speculatively or add domain events as part of an ordinary entity implementation.
- Do not change an entity's base class without a clear domain requirement and a review of its consequences.

## 4. Construction and EF Core

Every entity must have:

1. A private parameterless constructor for Entity Framework Core, with an explicit explanatory comment, such as:

   `// Required by Entity Framework Core.`

2. A private constructor that receives the state needed to create a valid instance.

3. A public static factory method named `Create(...)` as the supported creation API.

Requirements:

- Callers must not be able to instantiate an entity through a public constructor.
- Do not expose a public parameterless constructor.
- The factory must create a valid initial state; do not rely on callers to set required properties after construction.
- Follow the repository's existing conventions for ID assignment, timestamps, and base-class initialization. Do not invent ID generation or timestamp defaults without checking the codebase and requirements.
- Ensure the construction pattern remains compatible with the project's EF Core mappings and conventions.

## 5. Property Mutability

Choose property setters based on domain meaning:

- Use `private set` for state that can change during the entity's lifecycle, but only through domain methods.
- Use `init` for values that are immutable after the entity has been created.
- Do not expose public setters that allow application code to bypass domain rules.
- Do not make a property mutable merely for convenience. Prefer immutable state unless there is a legitimate domain operation that changes it.
- The private constructor and factory must initialize the required properties consistently with these mutability rules.
- Follow existing EF Core mapping patterns where immutable properties or backing fields require specific configuration; do not weaken encapsulation just to make persistence easier without first checking available patterns.

Typical examples:

- Identity and creation facts that must never change after creation: immutable (`init` according to the project's pattern).
- Lifecycle status or domain state that changes through explicit behavior: `private set`.
- Optional timestamps associated with later transitions: `private set`, updated only by the method that performs the corresponding transition.

Treat these examples as guidance; the actual business rules determine which properties are mutable.

## 6. Factory Method and Invariants

Expose a factory with the shape `public static <EntityName> Create(...)`, following the repository's result/exception conventions.

The factory must:

- Accept the data required to create the entity in a valid initial state.
- Validate entity-owned invariants before returning an instance.
- Reject invalid or missing required identifiers and references according to existing conventions.
- Validate required text, ranges, durations, and other primitive values where those invariants belong to the entity.
- Reuse value objects and their validation rather than duplicating their internal rules.
- Initialize lifecycle properties to legitimate initial values. Callers must not pass an arbitrary initial status when the domain defines a fixed initial status.
- Use the existing domain error definitions and `DomainException` conventions for invalid domain operations. Do not introduce a parallel error system.
- Avoid magic values. Put semantic or reused limits in appropriately named constants in the domain module that owns the rule. Do not create constants for every incidental literal, and do not invent business limits that have not been established.

The factory must not query a database, resolve services, call HTTP APIs, or load related entities. Validation that requires persistence or coordination between multiple entities belongs in the appropriate application workflow or domain service.

## 7. Rich Domain Model

Domain entities must be rich models, not just property bags. Put behavior and invariants that belong to the entity inside the entity itself.

- Add explicit, domain-named methods for operations that change the entity's state, such as `Close()`, `Cancel()`, `Start()`, `Accept()`, or other methods appropriate to the actual domain concept.
- Each state-changing method must check whether the current state permits the requested operation.
- Update related state consistently. For example, if a transition requires a timestamp, set that timestamp as part of the same method.
- Reject invalid transitions through existing domain errors and `DomainException` conventions; never silently ignore an invalid transition.
- Do not expose a public status setter or a generic `ChangeStatus()` method that bypasses transition rules.
- Keep immutable business terms immutable after creation when the domain rules require it.
- Do not add speculative methods or business rules merely because similar entities have them. Derive behavior from the request and the existing domain model.

## 8. Keep Responsibilities in the Right Layer

An entity may enforce its own invariants and modify its own state, but it must not:

- Access a repository or database.
- Resolve dependency-injected services.
- Make HTTP, messaging, or other infrastructure calls.
- Perform authorization based on the current request or user session.
- Coordinate multi-entity workflows that belong in the application layer.
- Perform wallet, payment, or other cross-aggregate operations directly.

When an operation must atomically coordinate multiple entities, persistence, or concurrency checks, keep the entity-level behavior explicit and let the application workflow coordinate the operation.

## 9. Domain Events and Aggregate Roots

- Do not add domain events unless the task requires them.
- If domain events are explicitly required, inspect the repository's `IDomainEvent` and `AggregateRootBase<>` implementation and follow its event-raising and collection conventions.
- Use the aggregate-root base class according to the rule in Section 3. Do not create custom event storage or dispatching mechanisms inside an entity.

## 10. Tests, Scope, and Verification

- Inspect the repository to determine whether a test project and established test conventions exist. Do not create a test project solely to implement an entity unless explicitly requested.
- Do not add persistence configuration, migrations, repositories, endpoints, handlers, or unrelated application workflows unless the task explicitly includes them.
- Do not modify unrelated entities or public contracts without a clear necessity. Explain any necessary scope expansion.
- Build the relevant project or solution when practical and report the actual result. Do not claim a successful build unless it was performed.
- In the completion summary, list changed files, key invariants and behaviors implemented, verification performed, and any unresolved assumptions.

## 11. Validation Responsibilities

Validation must be performed at the appropriate layer. Domain entities must not duplicate input validation that belongs to HTTP, application, or value object validation.

### Domain Entity Validation

Entity factories and domain methods must validate:

- Required reference types and values are not `null`, where applicable.
- Required identifiers are valid according to the project's identifier conventions.
- Required data is present and not empty when emptiness violates a domain invariant.
- The entity's own business invariants are preserved.
- State transitions are valid for the entity's current state.

These checks protect the entity from being created or left in an invalid domain state.

### Validation That Belongs Elsewhere

Do not validate primitive input constraints directly inside domain entities when those constraints are already the responsibility of another layer.

Examples include:

- String minimum and maximum lengths.
- Numeric minimum and maximum values.
- Input format and syntax.
- Request-specific field requirements.
- Other constraints that can be validated before domain entity creation.

Responsibility for these checks belongs to:

- **HTTP layer:** request validation, input format, and request-specific constraints.
- **Application layer:** use-case-specific validation and coordination of business operations.
- **Value objects:** constraints intrinsic to the represented value, such as a positive monetary amount, valid currency, or valid duration.

### Avoid Duplicate Validation

- Do not repeat validation already performed by a value object.
- Do not introduce entity-level checks for string lengths or primitive numeric ranges merely to duplicate HTTP or application validation.
- Do not create validation rules or arbitrary limits that have not been established by the project's requirements.
- Reuse existing validators, value objects, constants, and error definitions where appropriate.

For example, an entity factory may reject a `null` description or a description containing only whitespace if a meaningful description is required by the domain. It should not enforce the description's maximum character count when that constraint belongs to HTTP or application validation.

Similarly, an entity should require a non-null `Price` value object, but it should not revalidate the monetary amount if

## 12. Completion Checklist

Before considering an entity complete, verify:

- [ ] Entity class name ends with `Entity` and the class is `sealed`.
- [ ] Correct repository base class is used.
- [ ] A private EF Core parameterless constructor exists and has an explanatory comment.
- [ ] A private state-initializing constructor exists.
- [ ] Public creation goes through `public static Create(...)`.
- [ ] Mutable properties use `private set`; immutable properties use `init`, according to domain meaning and repository conventions.
- [ ] Factory validation protects the entity's initial invariants without duplicating value-object validation.
- [ ] Domain state changes through explicit methods that validate transitions.
- [ ] Existing domain errors and exception conventions are reused.
- [ ] No database or infrastructure access, or unrelated scope, was added.
- [ ] Build and verification results are reported accurately.