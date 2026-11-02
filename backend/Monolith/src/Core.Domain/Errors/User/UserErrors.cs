using Core.Abstractions.Errors;

namespace Core.Domain.Errors.User;

public static class UserErrors
{
    public static Error InvalidEmail =>
        new (UserCodes.InvalidEmail, ErrorType.Validation, "Invalid email.");

    public static Error InvalidPassword =>
        new (UserCodes.InvalidPassword, ErrorType.Validation, "Invalid password.");

    public static Error InvalidPasswordValidation =>
        new (UserCodes.InvalidPasswordValidation, ErrorType.Validation, "Invalid password validation.");

    public static Error InvalidRole =>
        new (UserCodes.InvalidRole, ErrorType.Validation, "Invalid role.");

    public static Error NotFound =>
        new (UserCodes.NotFound, ErrorType.NotFound, "Not found.");

    public static Error RoleNotFound =>
        new (UserCodes.RoleNotFound, ErrorType.NotFound, "Role not found.");

    public static Error AlreadyExists =>
        new (UserCodes.AlreadyExists, ErrorType.Conflict, "Already exists.");
}
