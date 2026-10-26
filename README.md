# BustHub

BustHub is a game boosting marketplace that connects customers looking for boosting services with boosters who provide them.

Customers can create boosting requests, receive offers from boosters, select a suitable offer, and track order progress. The platform is designed to support order management and secure payment handling throughout the service lifecycle.

## Tech Stack

- **Backend:** C#, .NET 10, ASP.NET Core Minimal APIs
- **Frontend:** Not yet defined
- **Database:** PostgreSQL
- **ORM:** Entity Framework Core
- **Authentication:** Keycloak (planned)
- **Handler Dispatching:** Wolverine
- **Infrastructure:** Docker, Docker Compose
- **Reverse Proxy:** Nginx (planned)

## Architecture

The backend is implemented as a monolith using a hybrid architecture influenced by Clean Architecture, Onion Architecture, Hexagonal Architecture, and Feature-Sliced Design.

The application follows Domain-Driven Design (DDD) principles and uses lightweight Command Query Responsibility Segregation (CQRS). Write operations use a rich domain model, while read operations use dedicated projections optimized for individual queries.

For more details, see [Architecture Documentation](architecture.md).

## Project Status

The backend foundation and architectural configuration are being prepared for feature development. Business functionality is being implemented incrementally.

