# Architecture

## 1. Overview

### Backend

- **Application type:** Monolith
- **Framework:** .NET 10
- **Architectural style:** A hybrid of Clean Architecture, Onion Architecture, Hexagonal Architecture, and Feature-Sliced Design

The backend combines these architectural approaches to maintain clear dependency boundaries, isolate infrastructure concerns, and organize feature-specific code into cohesive units.

The architecture distinguishes between the logical separation of responsibilities and the physical organization of feature implementations. Features are colocated for easier navigation without eliminating the responsibilities of individual architectural layers.

This document describes the current architecture and distinguishes existing implementations from planned capabilities. Message brokers, caching, and other additional infrastructure components are not part of the current implementation unless explicitly stated otherwise.

### Architectural Principles

#### Clean Architecture and Onion Architecture

The application is organized into layers with explicit dependency rules. Dependencies point inward, toward the domain and application logic, rather than toward outer infrastructure layers.

The domain remains independent of HTTP, database, and other infrastructure-specific implementations.

Application logic coordinates use cases and interacts with infrastructure through appropriate abstractions.

#### Hexagonal Architecture

The system separates inbound and outbound interactions through adapters and ports.

- **Inbound adapters** expose application functionality to external clients and protocols.
- **Outbound adapters** implement interactions with external systems and infrastructure.
- **Ports** define the abstractions through which application logic interacts with these adapters.

This separation prevents presentation and infrastructure concerns from being concentrated in a single layer.

#### Feature-Sliced Design

Application features are organized in a dedicated class library, `Core.Features`.

Each feature keeps its related implementation components together in a hierarchical directory structure. Features can be organized by version where necessary.

A feature may contain its HTTP endpoint, handler, command or query, result types, projections, and mapper within the same directory.

This organization reduces the effort required to navigate the codebase and understand a feature's complete request-processing flow.

Feature-oriented organization does not replace architectural layering. Each component retains its responsibility, regardless of its physical location.

`Core.Features` intentionally references both `Core.Application` and `Adapters.Inbound.Http`. This allows feature-specific endpoint implementations to use the shared `IEndpoint` abstraction while remaining colocated with their corresponding application handlers and contracts.

The feature library does not own dependency injection configuration, shared abstractions, or general-purpose infrastructure. These responsibilities remain in the appropriate projects.

## 2. Backend Projects and Responsibilities

### 2.1. `Core.Abstractions`
shared, framework-independent abstractions and primitives used across the backend, including aggregate root contracts, domain and integration event contracts, and common error primitives. Keep this module small and focused on genuinely shared concepts. Do not place feature-specific business logic, application use cases, infrastructure implementations, or dependency injection configuration here.

### 2.2. `Core.Domain`

Contains the domain model and business rules.

Responsibilities:

- Entities
- Value objects
- Enumerations
- Domain errors and error codes

Errors are organized by logical domain context. Error codes are defined separately from error descriptions and metadata.

For example, account-related errors are grouped under `Core.Domain.Errors.Account`.

`AccountCodes` defines stable error codes, while `AccountErrors` exposes corresponding `Error` instances with an error type and a human-readable description.

This separation provides consistent error identification and allows errors to be mapped to appropriate transport-level responses.

The domain layer must not depend on HTTP, Entity Framework Core, PostgreSQL, or other infrastructure-specific implementations.

### 2.3. `Core.Application`

Contains shared application-level abstractions and functionality.

Responsibilities:

- Application-facing ports and abstractions
- Result pattern implementation
- Application-level dependency injection registration
- Wolverine integration and configuration

This project provides shared application functionality used by feature implementations and adapters while respecting the established dependency boundaries.

Wolverine is used for handler dispatching. Its configuration is managed through `Core.Application`, using the relevant assembly supplied by `Bootstrap.Api`.

Wolverine is not used to handle HTTP requests or implement HTTP endpoints.

### 2.4. `Core.Features`

Contains feature-specific implementations organized by feature and, where necessary, by version.

Responsibilities may include:

- Request and response contracts
- Commands and queries
- Feature-specific result types
- Projection types
- Mappers
- HTTP endpoints implementing `IEndpoint`
- Request handlers

A typical feature keeps its related components together, making its implementation easier to navigate and maintain.

The library intentionally does not define its own dependency injection registrations, shared abstractions, or general-purpose helper infrastructure.

`Core.Features` references:

- `Core.Application`, for application-level abstractions and shared functionality.
- `Adapters.Inbound.Http`, for the `IEndpoint` abstraction and HTTP endpoint integration.

These dependencies are intentional and support the chosen feature-oriented code organization.

The presence of HTTP endpoint implementations in `Core.Features` does not transfer responsibility for HTTP infrastructure to that project. HTTP-specific middleware, endpoint infrastructure, and error mapping remain in `Adapters.Inbound.Http`.

### 2.5. `Adapters.Inbound.Http`

A class library responsible for receiving and processing HTTP requests.

Responsibilities:

- HTTP middleware
- The `IEndpoint` abstraction
- HTTP-specific error mapping
- Mapster integration and mapping configuration
- HTTP endpoint infrastructure

The API uses ASP.NET Core Minimal APIs.

Feature-specific endpoints implement `IEndpoint` and are colocated with their corresponding feature implementations in `Core.Features`.

The inbound adapter provides the HTTP-specific mechanisms used by these endpoints, including middleware and error mapping.

Domain and application errors are translated into appropriate HTTP responses within this adapter. HTTP concerns must not leak into the domain model.

### 2.6. `Adapters.Outbound.Postgres`

A class library responsible for PostgreSQL persistence using Entity Framework Core.

Responsibilities:

- Repository implementations
- `DbContext`
- Entity configurations
- Database-related dependency injection registration
- Persistence extensions
- Unit of Work implementation

The Unit of Work provides persistence and transaction operations, including `SaveChanges` and execution within a transaction.

This project implements the persistence-side abstractions required by the application without making the domain depend on Entity Framework Core or PostgreSQL-specific details.

### 2.7. `Migrations`

A separate class library dedicated to Entity Framework Core database migrations.

Responsibilities:

- Database migration files
- Design-time database context creation through a configured factory
- Migration-specific configuration

Migrations are generated using a dedicated command. The database connection string must be configured in `Migrations/appsettings.json` for the migration workflow.

The migration project is kept separate from the runtime API bootstrap project.

### 2.8. `Bootstrap.Api`

The composition root and application entry point.

Responsibilities:

- Application startup
- Composition of application services
- Registration of backend modules
- Application pipeline configuration
- Runtime configuration through `appsettings.json`
- Providing the relevant assembly for application and Wolverine configuration

The project intentionally contains minimal application-specific logic. Its primary purpose is to assemble the application from the class libraries.

The expected contents are:

- `Program.cs`
- `ApplicationBuilderExtensions`
- `BuilderServiceExtensions`
- `appsettings.json`

The extension methods delegate configuration and dependency injection registration to the corresponding modules. The bootstrap project should not duplicate registrations or implementations that belong to individual class libraries.

The relevant assembly is supplied from `Bootstrap.Api` during configuration, allowing `Core.Application` to configure Wolverine for handler dispatching.

### 2.9. Repository-Level Build Configuration

The monolith uses the following repository-level configuration files:

- `Directory.Build.props` — shared MSBuild properties and build configuration.
- `Directory.Packages.props` — centralized NuGet package version management.

The target framework is .NET 10, as defined by the project and build configuration.

## 3. Request Processing and Handler Dispatching

The architecture separates HTTP request handling, application use cases, domain rules, and outbound persistence.

A typical HTTP request follows this flow:

1. An HTTP request reaches an endpoint exposed through ASP.NET Core Minimal APIs.
2. The endpoint binds the incoming request and dispatches the corresponding operation through the application handler mechanism.
3. Wolverine dispatches the request to the appropriate handler.
4. The handler executes the application use case and coordinates the required operations.
5. Domain objects enforce the relevant business rules.
6. The handler interacts with persistence or other required capabilities through application-facing abstractions.
7. The PostgreSQL adapter implements the required persistence operations.
8. The endpoint returns the appropriate HTTP response, using the inbound adapter's error mapping where necessary.

The exact flow may vary by use case, but infrastructure-specific responsibilities must remain outside the domain model.

### Responsibility Boundaries

- **ASP.NET Core Minimal APIs:** HTTP request handling and endpoint execution.
- **`Adapters.Inbound.Http`:** HTTP infrastructure, middleware, endpoint abstractions, and HTTP error mapping.
- **Wolverine:** Handler dispatching.
- **`Core.Features`:** Feature-specific endpoints, handlers, and contracts.
- **`Core.Application`:** Shared application abstractions, ports, Result pattern, and Wolverine integration.
- **`Core.Domain`:** Domain entities, value objects, and business rules.
- **`Adapters.Outbound.Postgres`:** PostgreSQL persistence and transaction-related infrastructure.
- **`Bootstrap.Api`:** Application composition and startup.

Wolverine is not used as the HTTP endpoint framework.

## Domain Modeling and Data Access

### Domain-Driven Design (DDD)

The backend follows Domain-Driven Design (DDD) practices to model the business domain and encapsulate business rules within the domain model.

- **Rich Domain Model:** Domain entities encapsulate business behavior and enforce domain invariants rather than acting as passive data containers.
- **Aggregates:** Aggregates define consistency boundaries for domain state changes. Aggregate roots control access to the entities and value objects within their boundaries.
- **Value Objects:** Value objects represent domain concepts whose identity is defined by their values.
- **Domain Events:** Domain events can be used to represent significant business occurrences. Their usage and dispatching mechanisms are defined as needed by the implementation.

### Light CQRS

The application follows a lightweight form of Command Query Responsibility Segregation (CQRS), separating write operations from read operations at the application and data-access levels.

- **Write operations:** Commands are handled using the rich domain model. Domain entities and aggregate roots encapsulate business logic and enforce invariants before changes are persisted.
- **Read operations:** Queries use dedicated read projections tailored to the data required by each use case. Projections are retrieved directly from the database, preferably using a single query where practical, without loading and reconstructing the full domain model.
- **Shared database:** Read and write operations use the same database and persistence infrastructure. Separate databases and independent read/write storage models are not currently planned.

This approach separates the responsibilities of modifying domain state and retrieving application data without introducing the operational complexity of a distributed CQRS architecture.


## 4. Authentication and Authorization

Authentication and authorization are not yet implemented in the current version.

The planned implementation consists of two stages.

### Stage 1: Development Authentication

A basic authentication mechanism is planned for the development stage.

The initial scope includes:

- User registration
- User login
- JWT access tokens
- A token time-to-live of one day

The initial authentication mechanism will reside within the monolith.

This is a temporary development-stage solution and is not intended to represent the final identity architecture.

### Stage 2: Keycloak Integration

After the MVP is ready, Keycloak is planned as the identity provider.

The purpose of this stage is to introduce a dedicated identity management solution instead of maintaining the initial authentication implementation.

### Future Authorization Architecture

Authorization is initially expected to be handled within the monolith.

In the future, authorization may be moved to a separate authorization service or implemented using Keycloak's authorization capabilities.

The final approach has not yet been selected.

## 5. Infrastructure

The repository is organized into backend, frontend, and shared infrastructure areas.

The backend and frontend maintain their own infrastructure configuration, while the root-level infrastructure directory contains components shared across application areas.

### 5.1. Backend Infrastructure

The backend has its own infrastructure directory containing application-specific deployment configuration, including:

- `Dockerfile`
- `docker-compose.yml`
- `.env`

These files support backend containerization and local deployment.

### 5.2. Frontend Infrastructure

The frontend has its own infrastructure directory containing its application-specific deployment configuration.

The exact frontend architecture and implementation details are outside the scope of this document.

### 5.3. Shared Infrastructure

The root-level `infra` directory contains infrastructure components shared across application areas.

Examples include:

- Nginx
- RabbitMQ

For the MVP, Nginx is planned as the shared infrastructure component. RabbitMQ integration is planned for a future stage and is not part of the current implementation.

### 5.4. Docker Compose Organization

Separate Docker Compose configurations are maintained for:

- Backend
- Frontend
- Shared infrastructure

Each application area manages its own deployment configuration, while shared infrastructure components are configured separately.

## 6. Future Messaging Integration

Messaging is not part of the current implementation.

RabbitMQ integration is planned for a future stage, with Wolverine intended to support message handling and dispatching.

This future integration will extend the existing handler-dispatching approach without changing Wolverine's current responsibility for HTTP endpoint handling: HTTP remains the responsibility of ASP.NET Core Minimal APIs and the inbound HTTP adapter.

The details of message contracts, delivery guarantees, retries, and messaging-specific infrastructure will be documented when this integration is designed.

## 7. Open Architectural Questions

### 7.1. Endpoint Discovery and Registration

`IEndpoint` is defined in `Adapters.Inbound.Http`, and feature-specific endpoint implementations reside in `Core.Features`.

`Core.Features` references both `Core.Application` and `Adapters.Inbound.Http`.

The exact mechanism used to discover and register feature endpoints at application startup remains to be documented.

The endpoint registration mechanism must be distinguished from Wolverine's handler discovery and dispatching responsibilities.

## 8. Frontend

