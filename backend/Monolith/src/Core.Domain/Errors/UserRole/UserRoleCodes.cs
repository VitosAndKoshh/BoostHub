using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.UserRole;

public static class UserRoleCodes
{
    public static readonly ErrorCode InvalidUserId = new("user-role.invalid-user-id");
    public static readonly ErrorCode InvalidRoleId = new("user-role.invalid-role-id");
    public static readonly ErrorCode RoleAlreadyAssigned = new("user-role.role-already-assigned");
}
