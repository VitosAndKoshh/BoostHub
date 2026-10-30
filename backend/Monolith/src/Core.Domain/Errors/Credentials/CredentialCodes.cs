using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Credentials;

public sealed class CredentialCodes
{
    public static readonly ErrorCode InvalidEmail = new ("credential.invalid-email");
    public static readonly ErrorCode InvalidPassword = new ("credential.invalid-password");
    public static readonly ErrorCode InvalidPasswordValidation = new ("credential.invalid-password-validation");
    public static readonly ErrorCode InvalidRole = new ("credential.invalid-role");
    public static readonly ErrorCode NotFound = new ("credential.not-found");
    public static readonly ErrorCode RoleNotFound = new ("credential.role-not-found");
    public static readonly ErrorCode AlreadyExists = new ("credential.already-exists");
}