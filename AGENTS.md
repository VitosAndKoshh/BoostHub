# AGENTS.md

## Project Overview

BustHub is a game boosting marketplace. The repository contains a frontend application and a .NET 10 backend monolith built with ASP.NET Core Minimal APIs, EF Core, and PostgreSQL.

Frontend architecture is outside the scope of the backend instructions in this document. Do not invent frontend conventions or requirements.

Backend infrastructure is located under `backend/Monolith/infra/` and `backend/Monolith/docker/`. Additional infrastructure, including Nginx, is planned after the backend MVP.

## Before Making Changes

1. Read `README.md` and `architecture.md`.
2. Read relevant documentation under `docs/backend/`.
3. Check applicable nested `AGENTS.md` files and relevant skills under `.agents/skills/`.
4. Inspect existing implementations and conventions before introducing new abstractions or changing established behavior.
5. Ask for clarification when ambiguity materially affects business rules, security, API contracts, or architecture.

Do not invent requirements, duplicate documentation, or implement unrequested features.

Do not assume planned functionality, infrastructure, or projects already exist. Verify the actual repository state before relying on them.

## Architecture and Conventions

- Follow `architecture.md` for project responsibilities, dependency direction, domain modeling, CQRS, persistence, messaging, and application composition.
- Follow relevant documentation under `docs/backend/` for detailed implementation conventions.
- Follow applicable skills under `.agents/skills/` for specialized implementation conventions.
- Do not introduce architectural patterns, abstractions, dependencies, projects, or infrastructure without concrete justification.
- Keep documentation consistent with the implementation and distinguish planned functionality from implemented functionality.
- Do not introduce magic strings or values where named constants are appropriate. Follow the project's existing constants and configuration conventions.
- Preserve established error handling, validation, dependency injection, transaction, and persistence conventions.
- Keep changes within the owning project and respect the established project dependency direction.
- Do not modify frontend architecture or introduce frontend conventions unless explicitly requested.

## Implementation and Verification

- Make the smallest complete change that satisfies the request.
- Inspect relevant existing code before modifying it.
- Do not duplicate existing functionality or validation.
- Do not modify unrelated code or overwrite existing user work.
- Do not create test projects or add automated tests unless explicitly requested. Automated testing is deferred until after the MVP.
- Do not treat the absence of test projects as a defect.
- Build affected projects or the solution, and run available static-analysis or validation tooling when appropriate and permitted.
- Inspect command results before reporting verification status.
- Clearly distinguish successful checks, failed checks, and checks that were not performed.
- Never claim a command, build, test, migration, or infrastructure operation succeeded unless its result was checked.
- Report the changes made, relevant design decisions, verification results, and known limitations.

## Git and Branching

- Perform every file-changing task on a dedicated working branch, never directly on its base branch.
- Determine the base branch from the user's instructions or established repository workflow. Ask for clarification if it is materially ambiguous.
- Use the following branch naming format:

  `<type>/<base-branch>/<short-description>`

- Use a lowercase, hyphen-separated description of 2–3 words.

  Example: `docs/main/update-agent-rules`

- Supported types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Do not commit unrelated user changes, overwrite existing work, force-push, or rewrite shared history without authorization.
- Do not push a branch unless the user has explicitly authorized pushing.
- Do not merge a pull request or approve it on the user's behalf. The user retains responsibility for approving and merging changes.
- Inspect the working tree before performing operations that could affect existing changes.
- Never discard or overwrite user changes to make a task easier.

## Tool Permissions

- Git operations, project file edits, and .NET CLI operations are authorized within the scope of the task, subject to the rules above.
- Obtain explicit approval before running Docker or Docker Compose, starting or stopping infrastructure services, installing software, running non-Git/non-.NET scripts, or accessing external systems.
- File-edit permission does not imply permission to execute the modified configuration or start the associated services.
- Never bypass approval requirements through another tool or execution method.
- If an action requires approval, explain what action is needed and why, then wait for authorization.
- Follow repository protections and all applicable security requirements.

## Documentation Maintenance

- Update existing documentation when a change modifies an established architectural rule, implementation convention, or documented workflow.
- Do not create duplicate documentation or introduce documentation for areas outside the task's scope.
- Do not create frontend or infrastructure documentation unless explicitly requested or required by an established repository decision.
- Keep planned functionality clearly distinguished from implemented functionality.
- Do not silently resolve unresolved architectural or business decisions through documentation changes.