using Core.Abstractions.Errors;

namespace Core.Domain.Errors.UserRole;

public static class UserRoleErrors
{
    public static Error InvalidUserId =>
        new(UserRoleCodes.InvalidUserId, ErrorType.Validation, "Invalid user id");

    public static Error InvalidRoleId =>
        new(UserRoleCodes.InvalidRoleId, ErrorType.Validation, "Invalid role id");

    public static Error RoleAlreadyAssigned =>
        new(UserRoleCodes.RoleAlreadyAssigned, ErrorType.Conflict, "Role already assigned");
}
