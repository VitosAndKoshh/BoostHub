# Error Handling Rules

This document defines how errors move through the BoostHub backend and how they are translated into HTTP responses.

## 1. Responsibility Boundaries

Error handling is divided by responsibility:

- `Core.Domain` represents domain-level errors and invariant violations.
- `Core.Application` provides the established Result and application-facing error abstractions.
- `Core.Features` implements use cases, applies domain behavior, and propagates operation outcomes.
- `Adapters.Inbound.Http` maps supported errors and exceptions to HTTP responses.
- `Bootstrap.Api` configures the application pipeline.

Do not introduce HTTP-specific concepts into domain types.

## 2. Expected Failures and Exceptional Failures

Distinguish expected operation outcomes from exceptional execution failures.

Use the established Result pattern for expected outcomes such as a business operation being rejected or a requested resource not being available, where supported by the existing conventions.

Use exceptions for exceptional failures and follow the existing exception middleware behavior.

Do not use exceptions as the default mechanism for ordinary validation or business branching. Do not convert every unexpected exception into a successful-looking Result that hides the failure.

Inspect existing Result types and handlers before introducing a new error representation.

## 3. Domain Errors

Domain errors describe conditions meaningful to the business domain.

- Use existing domain error abstractions and error-code conventions.
- Keep domain errors independent of HTTP status codes and response DTOs.
- Do not place HTTP response formatting in domain types.
- Do not add a free-form `Message` property to domain exceptions when the established design intentionally represents errors through domain error information and codes.
- Do not duplicate validation that belongs to a value object or an earlier validation layer.

The HTTP layer handles `DomainException` through the established error-mapping mechanism. Domain errors must remain independent of that transport-specific mapping.

A domain error should identify the failure condition sufficiently for application-level handling without depending on a particular transport.

## 4. Application Results

Handlers must follow the existing Result conventions.

- Represent expected success and failure through the established result type.
- Preserve meaningful error information when propagating a failure.
- Do not silently discard a failed result.
- Do not report success when a required operation failed.
- Avoid creating a second application error hierarchy when the existing abstractions can represent the requirement.

When adding a new failure case, inspect comparable handlers and error definitions to preserve consistency.

## 5. HTTP Error Mapping

`Adapters.Inbound.Http` owns HTTP-level error mapping.

The current HTTP error-handling implementation includes `ExceptionHandlingMiddleware` and the shared error-status mapping mechanism.

The middleware handles the established exception categories separately:

- `ValidationException`: returns a client validation error response with HTTP `400 Bad Request`. Validation details include the established error codes, messages, and property names.
- `DomainException`: maps the domain error to an HTTP status through the existing `ToStatusCode()` mechanism.
- Unexpected exceptions: follow the shared unexpected-error handling path and return a server error without exposing internal exception details.

When changing error handling:

1. Inspect the current `ExceptionHandlingMiddleware`.
2. Inspect the current error-status mapper and error-code conventions.
3. Follow the established response format.
4. Reuse the existing status-code mapping for known domain errors.
5. Avoid exposing internal stack traces, database details, secrets, or implementation-specific exception messages to clients.
6. Preserve appropriate logging and diagnostic information according to existing conventions.

Do not introduce a feature-specific HTTP error mapper when the shared mapper can handle the case.

The middleware and error mapper are the source of truth for actual behavior. Do not maintain a separate status-code table in this document unless the project explicitly adopts one.

## 6. Validation

Validation must occur at the correct boundary.

- Transport validation checks request shape and input constraints.
- Application validation checks requirements of the use case.
- Domain validation protects business invariants.
- Value objects protect constraints intrinsic to their represented values.
- Database constraints protect data integrity at the persistence boundary.

Use FluentValidation and the existing validation conventions for feature-level request and use-case validation.

The current HTTP middleware handles `FluentValidation.ValidationException` separately from domain and unexpected exceptions. Preserve the established validation response format, including individual validation error codes and property names.

Do not duplicate the same primitive validation at every layer without a reason. However, critical business invariants must remain protected inside the domain model.

Validation failures should follow the established validation and HTTP mapping conventions.

## 7. Logging and Information Disclosure

Preserve diagnostic details in server-side logs according to the existing logging conventions.

The current middleware distinguishes expected validation and domain errors from unexpected exceptions:

- Validation failures are logged at warning level with relevant validation details.
- Domain errors are logged at warning level with the relevant error code.
- Unexpected exceptions are logged at error level with exception details for diagnosis.

When changing logging behavior:

- Return client-safe error information.
- Do not expose secrets, tokens, password hashes, connection strings, SQL details, or stack traces in HTTP responses.
- Avoid logging sensitive authentication or financial information.
- Do not suppress unexpected failures without a traceable diagnostic path.

Follow existing logging infrastructure rather than adding a new logging abstraction for one endpoint.

## 8. Verification

Automated testing is deferred until after the MVP. Do not create test projects or add automated tests unless explicitly requested.

When changing error