using Core.Abstractions.Errors;

namespace Core.Domain.Errors.Credentials;

public static class CredentialErrors
{
    public static Error InvalidEmail =>
        new (CredentialCodes.InvalidEmail, ErrorType.Validation, "Invalid email.");

    public static Error InvalidPassword =>
        new (CredentialCodes.InvalidPassword, ErrorType.Validation, "Invalid password.");
    
    public static Error InvalidPasswordValidation =>
        new (CredentialCodes.InvalidPasswordValidation, ErrorType.Validation, "Invalid password validation.");
    
    public static Error InvalidRole =>
        new (CredentialCodes.InvalidRole, ErrorType.Validation, "Invalid role.");
    
    public static Error NotFound =>
        new (CredentialCodes.NotFound, ErrorType.NotFound, "Not found.");

    public static Error RoleNotFound =>
        new(CredentialCodes.RoleNotFound, ErrorType.NotFound, "Role not found.");
    
    public static Error AlreadyExists =>
        new (CredentialCodes.AlreadyExists, ErrorType.Conflict, "Already exists.");
}