# Architecture and Implementation Rules

This document defines the architectural constraints and implementation rules for the BoostHub repository. Follow it when creating, modifying, or reviewing backend code.

Repository-wide workflow, branching rules, and tool permissions are defined in `AGENTS.md`. Detailed backend implementation conventions are documented under `docs/backend/`.

## 1. Mandatory Rules

Before implementing a change:

1. Read `README.md`, this document, and all applicable `AGENTS.md` files.
2. Read the relevant documentation under `docs/backend/`.
3. Inspect the existing implementation of the same or a similar feature before introducing new abstractions or conventions.
4. Identify the owning project, permitted dependencies, and appropriate verification methods.
5. Ask for clarification if a material business rule, security requirement, or architectural decision remains unresolved. Do not invent requirements.

During implementation:

- Follow existing project conventions and the rules in this document.
- Do not introduce unnecessary projects, layers, abstractions, frameworks, or dependencies.
- Do not duplicate existing functionality or validation.
- Do not introduce magic strings or values where named constants are appropriate.
- Do not claim planned functionality is implemented.
- Do not modify unrelated code unless the change is necessary for the requested task.
- Do not bypass architectural boundaries to make an implementation easier.
- Do not create test projects or add automated tests unless explicitly requested. Automated testing is deferred until after the MVP.
- Do not execute infrastructure operations without the approval required by `AGENTS.md`.

After implementation, run the relevant verification commands that are available and permitted. Report actual results and clearly identify checks that were not performed.

## 2. Repository Boundaries

BoostHub is a repository containing separate application areas:

- `backend/` — .NET 10 backend monolith.
- `frontend/` — frontend application whose architecture and implementation conventions are outside the scope of this document.

The backend monolith is located in `backend/Monolith/`.

The current backend infrastructure layout is:

```text
backend/Monolith/
├── docker/
│   └── Dockerfile.api
├── infra/
│   ├── docker-compose.yml
│   ├── .env
│   └── .env.example
└── src/
    └── .NET projects and source files
```

Nginx and additional deployment infrastructure are planned for a later stage, after the backend MVP. Do not assume that these components are already implemented.

Use the actual repository layout and existing files as the source of truth. Do not assume that illustrative directory trees are exhaustive or create missing directories and documentation without a concrete requirement.

Detailed backend implementation conventions are documented under `docs/backend/`.

## 3. Backend Architecture

The backend is a monolith built with .NET 10, ASP.NET Core Minimal APIs, EF Core, and PostgreSQL.

The architecture combines Clean Architecture, Onion Architecture, Hexagonal Architecture, feature-oriented organization, DDD practices, and Light CQRS. These are pragmatic conventions rather than a requirement to reproduce any architectural pattern mechanically.

The backend currently uses one PostgreSQL database for both read and write operations. There is no separate read store.

### 3.1. Project Ownership

| Project | Responsibilities |
|---|---|
| `Core.Abstractions` | Small shared primitives and contracts |
| `Core.Domain` | Domain entities, aggregate roots, value objects, business rules, domain errors, and domain-specific types |
| `Core.Application` | Application ports, repository abstractions, read-port projections, Result pattern, unit-of-work contracts, and application-facing security abstractions |
| `Core.Features` | Feature endpoints, commands, queries, handlers, HTTP request/response contracts, validators, and feature-specific mapping definitions |
| `Adapters.Inbound.Http` | `IEndpoint`, Minimal API infrastructure, endpoint discovery, HTTP middleware, HTTP error mapping, and shared Mapster integration |
| `Adapters.Outbound.Postgres` | EF Core `DbContext`, entity configurations, PostgreSQL queries, repository implementations, and unit-of-work implementation |
| `Adapters.Outbound.Security` | Implementations of application-facing security abstractions, including JWT generation and password hashing, with their configuration and dependency injection registration |
| `Migrations` | EF Core migrations and the design-time `DbContext` factory |
| `Bootstrap.Api` | Application startup, composition root, dependency injection composition, and HTTP pipeline configuration |

Use these ownership rules when deciding where a new type belongs.

Do not create a new project merely because a type does not fit an arbitrary folder hierarchy. First determine whether an existing project already owns the responsibility.

Do not assume that future integrations or planned projects already exist.

### 3.2. Dependency Rules

Follow the established project dependency direction:

- `Core.Domain` must not depend on infrastructure frameworks or adapters.
- `Core.Application` defines application-facing ports and abstractions; adapters implement them.
- `Core.Features` uses `Core.Application` and `Core.Domain`.
- `Adapters.Outbound.Postgres` must not reference `Core.Features`.
- `Adapters.Outbound.Security` implements security abstractions defined by the application layer and must not move security infrastructure into domain types.
- `Adapters.Inbound.Http` owns shared HTTP infrastructure.
- `Bootstrap.Api` composes implementations and registrations.
- Do not introduce circular project references.

**Intentional exception:** `Core.Features` references `Adapters.Inbound.Http` for `IEndpoint` and related endpoint integration. Preserve this established design. Do not use this dependency to introduce unrelated HTTP infrastructure into feature logic.

If a type is needed by multiple projects, identify its architectural responsibility and place it at the appropriate shared boundary. Do not make an adapter depend on a feature simply to reuse a type.

Before introducing or changing project references, inspect the existing `.csproj` files and verify that the dependency is consistent with these rules.

### 3.3. Application Composition

- Keep `Bootstrap.Api` as the composition root.
- Register application services, Wolverine, and FluentValidation through the existing `AddApplication` registration mechanism.
- Keep infrastructure-specific registration in the project that owns the integration.
- Keep HTTP endpoint discovery and registration in the existing `MapEndpoints` mechanism using assembly scanning.
- Keep shared Mapster registration in `Adapters.Inbound.Http`.
- Keep feature-specific Mapster mapping definitions with their respective features in `Core.Features`.
- Do not introduce a separate dispatcher abstraction such as `IDispatcher` when the existing Wolverine integration already provides the required dispatching behavior.
- Do not register HTTP endpoints through Wolverine. HTTP endpoint discovery and application handler dispatching are separate responsibilities.

Inspect the existing registration, assembly scanning, and dependency injection conventions before modifying application composition.

Do not introduce duplicate registration mechanisms when an existing extension or discovery mechanism already serves the requirement.

### 3.4. Authentication and Security

The current backend includes application-facing security abstractions and infrastructure implementations for JWT generation and password hashing.

- Keep security abstractions such as `IJwtProvider` and `IPasswordHasher` in `Core.Application`.
- Keep their implementations and security-specific configuration in `Adapters.Outbound.Security`.
- Keep authentication use cases, including registration and login, in `Core.Features`.
- Keep HTTP authentication configuration and request-pipeline integration in the appropriate existing infrastructure and composition projects.
- Do not place password-hashing or JWT implementation details in domain entities.
- Do not expose password hashes, secrets, signing keys, or tokens in logs or error responses.
- Inspect the existing authentication flow and configuration before changing token claims, token lifetime, password-hashing behavior, or credential persistence.

Keycloak integration and any dedicated authorization service remain planned unless the current implementation confirms otherwise. Do not introduce either as part of an unrelated feature.

## 4. Feature Implementation Rules

Organize backend use cases by feature and, where applicable, API version.

A feature typically contains the types required to implement its use case:

- Endpoint.
- HTTP request and response contracts.
- Command or query.
- Handler.
- Validator, when validation is required.
- Feature-specific mapping definitions.
- Supporting feature-specific types.

Not every feature requires every type. Add only the components necessary for the requested behavior.

Keep transport contracts, application operations, domain types, and persistence projections distinct. Do not reuse an HTTP response DTO as a domain entity or persistence contract merely to reduce the number of types.

For a new feature:

1. Find an existing feature with a similar operation.
2. Follow its naming, folder, endpoint, handler, mapping, and registration conventions.
3. Determine whether the operation is a command or a query.
4. Choose the appropriate domain or read-persistence path.
5. Verify the change using available build and static-analysis tooling.
6. Update documentation when the change affects an architectural rule or a documented convention.

Automated testing is deferred until after the MVP. Do not create test projects or add automated tests unless explicitly requested.

Detailed implementation procedures belong in `docs/backend/application-flow.md`.

## 5. Domain Modeling Rules

Use DDD practices to express business behavior and protect domain invariants.

- Domain entity classes use the `Entity` suffix and are declared `sealed`.
- Simple entities inherit from `EntityBase<T>`.
- Aggregate roots inherit from `AggregateRootBase<T>` when they own aggregate behavior and domain-event responsibilities, following the established base-class contracts.
- Keep constructors and state changes consistent with existing domain entity conventions.
- Protect business invariants inside the domain model.
- Let value objects enforce constraints intrinsic to their values.
- Do not duplicate validation already performed by value objects or upstream validation.
- Keep primitive input validation in the appropriate HTTP/application validation layer unless the constraint is an intrinsic value-object invariant.
- Create domain events through aggregate-root behavior, not arbitrary external code.
- Keep domain errors independent of HTTP status codes and transport formats.
- Do not introduce infrastructure dependencies into domain types.

Do not turn entities into passive data containers when business rules belong to them. Conversely, do not move application workflows, persistence operations, or database queries into domain entities.

Follow the established entity construction and encapsulation conventions, including EF Core compatibility requirements.

Before creating or substantially modifying domain models, read `docs/backend/domain-modeling.md` and the applicable domain-entity skill when available.

## 6. Read and Write Operations

BoostHub uses Light CQRS with one PostgreSQL database. There is no separate read store.

### 6.1. Write Operations

- Represent use cases that change application state with commands and handlers.
- Apply business changes through rich domain entities and aggregate roots.
- Preserve domain invariants.
- Use repository and unit-of-work abstractions where appropriate.
- Use the established transaction mechanism when the operation requires transactional consistency.
- Keep persistence concerns out of feature handlers.

Do not bypass domain behavior by directly assigning entity state from an HTTP endpoint or persistence adapter.

Do not introduce a new transaction mechanism when the existing unit-of-work abstraction satisfies the requirement.

### 6.2. Read Operations

- Represent read use cases with queries and handlers.
- Query through application-facing read ports.
- Return projections tailored to the use case.
- Query the database through the persistence adapter instead of loading full aggregates when unnecessary.
- Prefer a single database query where practical.

**Read-port ownership rules:**

- Read-port interfaces live in `Core.Application`.
- Projection types returned by those interfaces live alongside the corresponding ports in `Core.Application`.
- PostgreSQL implementations live in `Adapters.Outbound.Postgres`.
- Query handlers and feature-specific HTTP contracts live in `Core.Features`.

The PostgreSQL adapter must not reference `Core.Features` to access projections.

Do not create a universal read repository with numerous unrelated parameters. Define abstractions around actual query requirements and use cases.

A projection may combine data from multiple tables. One domain concept may have multiple projections for different use cases.

Do not create a separate read-model project unless a concrete architectural requirement justifies it.

See `docs/backend/persistence.md` for persistence conventions.

## 7. Persistence and Transactions

- Use EF Core and PostgreSQL through `Adapters.Outbound.Postgres`.
- Keep entity mappings in the established entity-configuration structure.
- Keep `DbContext` usage inside persistence infrastructure.
- Do not inject `DbContext` directly into feature handlers.
- Use application-facing repository and unit-of-work abstractions.
- Use `IUnitOfWork.ExecuteInTransactionAsync` for operations requiring the established explicit transaction mechanism.
- Respect existing transactions. Nested operations must not independently save or commit a transaction owned by an outer operation.
- Account for EF Core execution-strategy retries when writing transaction callbacks.
- Do not perform external side effects inside retryable database transaction callbacks.
- Keep database schema changes in the `Migrations` project and follow the established migration workflow.

Inspect the relevant repository, entity configuration, unit-of-work implementation, and migration workflow before changing persistence behavior.

Do not assume test projects exist. Automated testing is deferred until after the MVP. Verify persistence changes using available build and static-analysis tooling, and report any verification that could not be performed.

See `docs/backend/persistence.md` for detailed rules.

## 8. Error Handling

Use the existing Result pattern and centralized HTTP error mapping.

- Represent expected operation outcomes using the established result abstractions.
- Use domain errors for domain-level failures.
- Do not expose infrastructure exceptions as ordinary business errors.
- Keep HTTP status mapping in the inbound HTTP layer.
- Do not add HTTP-specific behavior to domain errors.
- Follow the existing `ExceptionHandlingMiddleware` and shared error-status mapping conventions.
- Preserve the established error contracts and avoid introducing a second error-handling mechanism for the same feature.

Domain errors describe domain failures. HTTP status codes and transport-specific error responses belong to the inbound HTTP layer.

See `docs/backend/error-handling.md`.

## 9. Messaging and Future Integrations

RabbitMQ, inbox/outbox processing, and Keycloak integration are planned capabilities, not assumptions about the current implementation.

Do not introduce these integrations into a feature unless the task explicitly requires that work and the relevant design is sufficiently established.

### 9.1. Intended Messaging Boundaries

The current application uses Wolverine for internal application handler dispatching, registered through `AddApplication`. Do not introduce a separate dispatcher abstraction unless a concrete requirement justifies it.

The planned messaging responsibilities are:

- Internal application handler dispatching — the existing Wolverine integration.
- `Adapters.Inbound.Messaging` — future inbound message consumption and inbox processing.
- `Adapters.Outbound.RabbitMq` — future outbound broker publication and outbox processing.
- `Contracts.Messaging` — future integration-event contracts, separated into `IntegrationEvents/In` and `IntegrationEvents/Out`.

These future projects and folders must not be treated as existing components unless they are present in the repository.

### 9.2. Messaging Invariants

When implementing messaging, preserve the following intended design:

- Domain events and integration events are different concepts.
- Domain events originate from aggregate-root behavior.
- Business changes and their corresponding outbox records must be committed atomically.
- Outbound publication must not occur directly inside a retryable database transaction callback.
- Delivery is at least once; consumers must be idempotent.
- Inbox and outbox processing must account for duplicate delivery and retry behavior.
- The planned retention period for sent inbox/outbox records is seven days.

Do not claim that domain-event dispatch, RabbitMQ publication, inbox/outbox persistence, or background workers are implemented unless the actual code confirms it.

See `docs/backend/messaging.md` when implementing messaging functionality.

### 9.3. Authentication and Authorization

Authentication and authorization are evolving areas.

- The current code includes JWT generation and password hashing. Inspect the existing registration, login, and authentication configuration before changing their behavior.
- Do not assume Keycloak or a dedicated authorization service is already implemented.
- Do not assume that a complete authorization policy or permission system exists merely because authentication is configured.
- Follow the existing code and the explicitly established requirements for the requested task.
- Do not introduce a new authentication or authorization architecture without a concrete requirement and sufficient design decisions.

## 10. Frontend and Infrastructure Scope

Frontend architecture and implementation conventions are outside the scope of this document. Do not invent or impose frontend-specific architectural rules based on assumptions.

The current backend infrastructure files are located under `backend/Monolith/infra/` and `backend/Monolith/docker/`, as described in Section 2.

Nginx and additional deployment infrastructure are planned after the backend MVP. Do not assume they are already implemented.

Infrastructure operations, including Docker and Docker Compose execution, require the approval specified in `AGENTS.md`.

Permission to edit an infrastructure configuration file does not automatically authorize running the associated services.

Do not add infrastructure documentation or create infrastructure components merely because they are mentioned as future plans. Implement them only when the task explicitly requires them and the necessary design is established.

## 11. Testing and Verification

Automated testing is deferred until after the MVP.

- Do not create test projects or add automated tests unless explicitly requested.
- Do not treat the absence of test projects as a defect.
- Build the affected projects or solution when appropriate and permitted.
- Run available static-analysis or validation tooling when relevant.
- Inspect command results before reporting verification status.
- Clearly distinguish checks that passed, checks that failed, and checks that were not run.
- Do not claim that a build, test, migration, or infrastructure operation succeeded unless its result was actually checked.
- Do not execute commands that require additional approval under `AGENTS.md` without obtaining that approval.

Revisit the testing conventions after the MVP, when the testing strategy and project structure are established.

## 12. Architectural Decision Procedure

When a requested change does not fit an obvious existing pattern, determine the answer in this order:

1. Identify the business behavior and its consistency requirements.
2. Find an existing implementation with similar responsibilities.
3. Identify the owning project and permitted dependency direction.
4. Determine whether the change is a write operation, read operation, transport concern, or infrastructure integration.
5. Reuse established abstractions when they satisfy the requirement.
6. Introduce a new abstraction only when it solves a concrete problem.
7. If the change requires a new architectural dependency, new infrastructure, or an unresolved business decision, ask for clarification rather than silently changing the architecture.
8. Update the relevant documentation when architectural rules or established implementation conventions change.

The objective is to implement the requested behavior consistently with the existing system, not to redesign the architecture for every new feature.