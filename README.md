# BoostHub

BoostHub is a game boosting marketplace that connects customers looking for boosting services with boosters who provide them.

Customers can create boosting requests, receive offers from boosters, select a suitable offer, and track order progress. The platform is designed to support order management and secure payment handling throughout the service lifecycle.

## Tech Stack

- **Backend:** C#, .NET 10, ASP.NET Core Minimal APIs
- **Frontend:** Not yet defined
- **Database:** PostgreSQL
- **ORM:** Entity Framework Core
- **Authentication:** JWT-based authentication with password hashing (current implementation)
- **Handler Dispatching:** Wolverine
- **Validation:** FluentValidation
- **Mapping:** Mapster
- **Infrastructure:** Docker, Docker Compose
- **Identity Provider:** Keycloak (planned)
- **Reverse Proxy:** Nginx (planned)

## Architecture

The backend is implemented as a monolith using a hybrid architecture influenced by Clean Architecture, Onion Architecture, Hexagonal Architecture, and feature-oriented design.

The application follows Domain-Driven Design (DDD) principles and uses lightweight Command Query Responsibility Segregation (CQRS). Write operations use a rich domain model, while read operations use dedicated projections optimized for individual queries.

The solution separates domain logic, application abstractions, feature implementation, inbound HTTP infrastructure, outbound infrastructure, and application composition.

For more details, see [Architecture Documentation](architecture.md).

## Project Status

The backend is under active development. Its architectural foundation, authentication flow, persistence infrastructure, and core application components are being implemented incrementally.

The MVP is being developed as a monolith. Additional infrastructure and integrations, including Keycloak, Nginx, and broker-based messaging, are planned for later stages.

The frontend technology stack and architecture have not yet been defined.