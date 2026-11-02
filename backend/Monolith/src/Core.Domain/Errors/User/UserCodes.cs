using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.User;

public sealed class UserCodes
{
    public static readonly ErrorCode InvalidEmail = new ("user.invalid-email");
    public static readonly ErrorCode InvalidPassword = new ("user.invalid-password");
    public static readonly ErrorCode InvalidPasswordValidation = new ("user.invalid-password-validation");
    public static readonly ErrorCode InvalidRole = new ("user.invalid-role");
    public static readonly ErrorCode NotFound = new ("user.not-found");
    public static readonly ErrorCode RoleNotFound = new ("user.role-not-found");
    public static readonly ErrorCode AlreadyExists = new ("user.already-exists");
}
