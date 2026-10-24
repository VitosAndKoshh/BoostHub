# BustHub

BustHub is a game boosting marketplace that connects customers looking for boosting services with boosters who provide them.

Customers can create boosting requests, receive offers from boosters, select a suitable offer, and track order progress. The platform is designed to support order management and secure payment handling throughout the service lifecycle.

## Tech Stack

- **Backend:** C#, .NET 10, ASP.NET Core Minimal APIs
- **Frontend:** TBD
- **Database:** PostgreSQL
- **ORM:** Entity Framework Core
- **Authentication:** Keycloak (planned)
- **Handler Dispatching:** Wolverine
- **Infrastructure:** Docker, Docker Compose, Nginx

## Architecture

The backend is implemented as a monolith using a hybrid architecture that combines Clean Architecture, Onion Architecture, Hexagonal Architecture, and Feature-Sliced Design.

The application follows Domain-Driven Design (DDD) practices and uses lightweight CQRS, with a rich domain model for write operations and dedicated read projections for queries.

For more details, see [Architecture Documentation](docs/architecture.md).