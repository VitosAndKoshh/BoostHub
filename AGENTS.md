# AGENTS.md

## Project Overview

BustHub is a game boosting marketplace connecting customers with boosters.

This repository contains the frontend, backend, and shared infrastructure. The backend is a monolith built with C# and .NET 10, ASP.NET Core Minimal APIs, Entity Framework Core, and PostgreSQL.

Follow the existing implementation, documented architecture, and established conventions. Do not introduce new architectural patterns, abstractions, or infrastructure without a concrete justification.

## Instructions and Documentation

Before making changes:

1. Read the root `README.md` and `architecture.md`.
2. Read relevant documentation in `docs/`, if present.
3. Inspect the existing implementation, related features, abstractions, and tests.
4. Check for additional `AGENTS.md` files or applicable project-specific instructions in the directories being modified.

For domain-level changes, review the relevant domain model and business rules. For architectural changes, assess their impact on module boundaries and dependency direction.

Keep documentation consistent with the actual implementation. Clearly distinguish implemented functionality from planned functionality.

Do not duplicate entire documentation pages in this file.

## Architecture

The backend is a monolith that combines the following approaches:

- Clean Architecture and Onion Architecture for dependency direction and separation of concerns.
- Hexagonal Architecture for inbound and outbound adapters and application-facing abstractions.
- Feature-Sliced Design for organizing feature-specific code.
- Domain-Driven Design (DDD) for domain modeling and business logic.
- Lightweight Command Query Responsibility Segregation (Light CQRS) for separating write and read responsibilities.

Respect the established project structure and module boundaries.

### Module Responsibilities

- `Core.Domain`: domain entities, value objects, aggregates, domain rules, and domain errors. Must not depend on HTTP, EF Core, PostgreSQL, or infrastructure implementations.
- `Core.Application`: application-level abstractions, shared application mechanisms, Result pattern, and Wolverine configuration and integration.
- `Core.Features`: feature-specific requests, commands, queries, handlers, validators, mappings, responses, read projections, and HTTP endpoints, following the existing organization.
- `Adapters.Inbound.Http`: ASP.NET Core Minimal API infrastructure, endpoint abstractions, HTTP middleware, HTTP error mapping, and HTTP-specific configuration.
- `Adapters.Outbound.Postgres`: EF Core persistence, DbContext, entity configurations, repositories, Unit of Work, and persistence-related dependency registration.
- `Migrations`: database migrations and design-time migration configuration.
- `Bootstrap.Api`: application entry point and composition root, responsible for composing application modules and infrastructure.
- Frontend and infrastructure projects: follow their own existing structure and conventions.

These responsibilities describe the intended boundaries. Inspect the current code before changing them.

Do not introduce dependencies between modules without justification. Keep framework-specific concerns outside the domain model.

### Dependency Injection and Handler Dispatching

- Follow the existing dependency registration and composition-root conventions.
- Do not add dependency injection registration to `Core.Features` unless the architecture is explicitly revised.
- Use Wolverine for application handler dispatching.
- HTTP endpoints are implemented using ASP.NET Core Minimal APIs; Wolverine does not handle HTTP endpoints.
- RabbitMQ integration through Wolverine is a planned capability, not an assumed part of the current implementation.

## Domain Modeling

Follow the project's DDD practices.

- Use rich domain entities and aggregate roots to encapsulate business behavior and enforce domain invariants.
- Keep business rules in the domain model rather than duplicating them across handlers and endpoints.
- Use value objects for domain concepts where they improve correctness and express domain meaning.
- Treat aggregate roots as the entry points for modifying aggregate state.
- Respect aggregate boundaries and consistency requirements.
- Use domain errors and domain exceptions according to existing conventions.
- Raise domain events only for meaningful domain occurrences and follow the existing event-handling conventions.
- Do not introduce an aggregate, entity, value object, domain service, or repository solely to follow a pattern. Each abstraction must serve a concrete domain or architectural purpose.

Do not weaken business invariants to simplify persistence, mapping, or API implementation.

## Read and Write Operations

Follow the existing Light CQRS approach.

### Write Operations

- Handle state changes through commands and the rich domain model.
- Enforce business rules and domain invariants before persisting changes.
- Use the existing repository and Unit of Work abstractions where applicable.
- Follow the established transaction and persistence conventions.

### Read Operations

- Use dedicated read projections tailored to each query's requirements.
- Retrieve projections directly from the database without reconstructing the full domain model when it is unnecessary.
- Prefer database-side projection and a single query when practical.
- Avoid loading entire entity graphs when only a subset of fields is required.

Read and write operations currently share the same database. Do not introduce separate databases, event sourcing, a separate read store, or distributed CQRS infrastructure without explicit architectural approval.

## Feature and API Implementation

- Follow the existing feature and version organization.
- Keep feature-specific behavior within its appropriate feature.
- Use ASP.NET Core Minimal APIs and the existing `IEndpoint` abstraction for HTTP endpoints.
- Follow existing request, response, validation, mapping, handler, and result conventions.
- Keep HTTP status codes and response formatting in the inbound HTTP layer.
- Do not expose domain entities directly as public API contracts unless the existing design explicitly requires it.
- Do not change API routes, request or response contracts, or externally observable behavior without an explicit requirement.

Do not create generic abstractions for a single use case when a straightforward implementation is sufficient.

## Error Handling

Follow the existing error-handling pipeline. Error-to-HTTP mapping is centralized and must not be reimplemented in individual features or endpoints.

- **Exception handling:** `ExceptionMiddleware` handles exceptions and maps recognized exception types to appropriate HTTP responses according to the existing conventions.
- **Application and domain errors:** Custom errors are mapped to HTTP responses through the existing `ErrorMapper`.
- **Layer separation:** Domain and application errors must remain independent of HTTP status codes and response formatting. HTTP-specific mapping belongs to the inbound HTTP adapter.
- **Consistency:** Reuse existing error definitions, codes, and mapping rules. Do not introduce duplicate mappings or feature-specific error-to-HTTP conversion logic.
- **Expected failures:** Use the established Result pattern for expected application and domain failures where appropriate.
- **Unexpected failures:** Do not swallow unexpected exceptions or expose internal exception details to clients.

When adding a new error or exception type, extend the existing mapping mechanism where necessary instead of creating a parallel error-handling pipeline.

## Persistence and Transactions

- Follow the existing EF Core configurations, repository conventions, and Unit of Work implementation.
- Keep persistence-specific mappings and configuration in the outbound persistence adapter.
- Preserve transactional consistency for operations that modify related domain state.
- Do not bypass aggregate behavior by updating domain state directly through persistence code.
- Do not modify database schema or migrations unnecessarily.
- Never assume that a migration is safe to apply to an existing database without considering its impact on stored data.

## Security and Authentication

- Never commit secrets, credentials, tokens, or production configuration.
- Follow existing authentication, authorization, validation, and input-handling conventions.
- Do not disable security checks to make an implementation or test pass.
- Do not introduce a custom authentication or authorization mechanism when an existing project abstraction or documented design applies.
- Treat planned authentication and authorization capabilities as unimplemented until verified in the codebase.
- Do not run destructive operations against shared or production environments without explicit approval.

## Implementation Guidelines

Before implementing a change:

1. Understand the requested behavior and relevant existing code.
2. Identify the affected features, domain rules, modules, and dependencies.
3. Prefer the smallest complete change that satisfies the requirement.
4. Reuse existing abstractions when appropriate.
5. Add new abstractions only when they solve a real problem.
6. Avoid unrelated refactoring, speculative features, and unnecessary dependencies.
7. Preserve compatibility unless a breaking change is explicitly requested.

If a requirement is ambiguous and different interpretations would materially affect domain behavior, API contracts, security, or architecture, ask for clarification instead of inventing requirements.

For low-risk implementation details, use the simplest choice consistent with the existing codebase and document important assumptions when necessary.

## Testing and Verification

- Add or update tests for changed behavior.
- Test domain invariants, successful scenarios, error cases, and relevant boundary conditions.
- Follow the existing unit and integration testing conventions.
- Prefer focused tests that verify observable behavior rather than implementation details.
- Run relevant tests and build commands after making changes.
- Run formatting or static analysis checks when required by the project.
- Never claim a command succeeded unless it was executed and its result was checked.
- Clearly report failed checks, skipped checks, and commands that could not be executed.
- Do not modify or remove tests merely to make the implementation pass without establishing that the tests are incorrect.

## Documentation

Update documentation when a change materially affects:

- Architecture or module responsibilities.
- Domain concepts, aggregate boundaries, or business invariants.
- API contracts or business workflows.
- Configuration, migrations, local development, or deployment.
- Implemented versus planned functionality.

Keep documentation concise, accurate, and consistent with the code.

### Constants and Magic Values

- Do not introduce magic strings or magic values in application code.
- Extract reusable string literals and configuration keys into named constants.
- Configuration section names, option keys, and other configuration-related identifiers must be defined as constants in the module that owns the corresponding configuration.
- Dependency injection registrations and options binding must reference these constants instead of repeating string literals.
- Keep constants close to their responsibility. For example, HTTP configuration constants belong to `Adapters.Inbound.Http`, while PostgreSQL configuration constants belong to `Adapters.Outbound.Postgres`.
- Do not place module-specific constants in shared abstractions or unrelated modules.
- Avoid creating generic constants classes that mix unrelated responsibilities.
- Do not extract every literal mechanically. Values that are inherently part of the language syntax or are clearer as local literals do not need to become constants. Prefer named constants when a value has semantic meaning, is reused, or represents a configuration contract.

## Completion Report

When finishing a task, summarize:

- What changed and why.
- Important design decisions and assumptions.
- Tests, builds, and other checks executed, including their results.
- Known limitations or follow-up work.

Do not claim that functionality, tests, migrations, or infrastructure are complete unless the corresponding work has actually been verified.

## Agent Workflow and Permissions

### 1. Understand the Request

Before making changes:

1. Analyze the request and identify its scope.
2. Inspect the relevant code, documentation, and existing conventions.
3. Identify ambiguities, missing requirements, and decisions that affect domain behavior, architecture, security, or API contracts.
4. Ask the user for clarification when a material decision cannot be made reliably from the available context.

Do not invent requirements, silently make consequential assumptions, or implement additional features that were not requested.

For routine implementation details, follow existing conventions and choose the simplest appropriate solution.

### 2. Permissions and Approval

- Ask the user for explicit permission before performing an action that requires their approval or elevated access.
- Do not bypass permission restrictions, repository protections, or approval requirements.
- Explain what permission is needed and why before requesting it.
- If permission is denied or unavailable, do not attempt to achieve the same result through an alternative unauthorized method.
- Never perform destructive operations or change security settings without explicit approval.

### 3. Branching Strategy

Every task that changes project files must be performed in a new, dedicated working branch.

- Never implement a task directly on the base branch.
- Determine the base branch from the user's instructions or the repository's established workflow.
- If the base branch is ambiguous and the choice could affect the result, ask the user.
- Create the working branch from the selected base branch.
- Keep all task-related changes in that working branch.
- Do not mix unrelated changes into the same branch.

Until a ticketing system is introduced, use the following naming convention:

`<type>/<base-branch>/<short-description>`

Supported types:

- `feat` — new functionality.
- `fix` — bug fixes.
- `refactor` — behavior-preserving structural changes.
- `docs` — documentation-only changes.
- `test` — test-only changes.
- `chore` — maintenance and tooling changes.

The description must contain 1–3 concise, lowercase, hyphen-separated words.

Examples:

- `feat/main/wallet-transfer`
- `fix/main/order-validation`
- `docs/main/domain-model`

Do not invent ticket numbers. If a ticketing system is introduced later, follow its prescribed branch naming convention.

### 4. Git and Remote Repository Rules

- Never commit task changes directly to the base branch.
- Never push commits directly to the base branch or another branch that is not the task's dedicated working branch.
- Do not force-push, rewrite shared history, or bypass branch protections without explicit approval.
- Before pushing a working branch to a remote repository, request permission if that action has not already been authorized.
- If remote access or permissions are unavailable, keep the changes in the working branch and report the limitation.
- Do not commit unrelated user changes, discard existing work, or overwrite files without authorization.

### 5. Pull Requests

After completing the task and performing the available verification:

1. Review the changes for correctness, scope, and unintended modifications.
2. Run the relevant tests and build checks.
3. Prepare a pull request targeting the selected base branch.
4. Include a concise title and a description explaining:
   - What changed.
   - Why the changes were necessary.
   - Important implementation decisions.
   - Tests and verification performed, including failures or skipped checks.
   - Known limitations or follow-up work.
5. Link the relevant ticket if one exists.

Creating a pull request must not be treated as permission to merge it.

The user is the final reviewer and the only person authorized to approve and merge the changes. Never merge a pull request, approve it on the user's behalf, or bypass the review process.

If the agent cannot create a pull request because remote operations require additional permission or access, request the necessary permission or report what remains to be done.

### 6. Completion

A task is complete from the agent's perspective when the requested implementation is finished, relevant verification has been performed, and the changes are ready for human review.

Report:

- The working branch and its base branch.
- The changes made.
- Verification results.
- The pull request link, if created.
- Any outstanding permissions, blockers, or follow-up actions.

Do not claim that a branch was pushed, a pull request was created, or a check passed unless the action was performed and its result verified.

## Tool Usage and Execution Permissions

### Authorized Operations

The agent is authorized to perform the following operations within the scope of the requested task:

- Git operations, including inspecting repository status and history, creating branches, making commits, and managing changes within the task's working branch.
- Creating, editing, moving, and deleting project files when required by the task.
- Using the .NET development ecosystem, including `dotnet` CLI commands for restoring dependencies, building projects, running tests, managing solutions and projects, and creating or applying EF Core migrations when appropriate to the task and environment.
- Inspecting source code, project configuration, package references, and build output.
- Running existing project-specific formatting, analysis, and verification commands when they belong to the authorized .NET development workflow.

These permissions do not override branch restrictions, repository protections, security requirements, or the approval rules defined elsewhere in this document.

### Operations Requiring Explicit Approval

Before executing an operation outside the authorized categories above, the agent must explain the intended action and ask the user for explicit permission.

Examples include, but are not limited to:

- Running commands or scripts outside the authorized Git and .NET workflows.
- Installing system packages, global tools, or unrelated software.
- Running Docker, Docker Compose, containers, or other infrastructure services.
- Starting, stopping, or modifying external services.
- Executing database administration commands outside the explicitly authorized .NET workflow.
- Accessing or modifying remote systems, cloud resources, or production environments.
- Running scripts, executables, or automation whose effects have not been established.
- Performing destructive operations that could affect user data, shared environments, or unrelated project work.

When an operation requires approval, the agent must not execute it until the user explicitly authorizes it.

### Safe Execution

- Prefer commands whose purpose and effects are clear.
- Inspect unfamiliar scripts and commands before proposing their execution.
- Do not treat the presence of a script in the repository as automatic permission to execute it.
- Do not bypass approval requirements by invoking a restricted operation through another tool, script, or command.
- If a task cannot be completed within the authorized operations, explain the limitation and request permission for the specific additional action.

When in doubt about whether an operation is authorized, ask before executing it.