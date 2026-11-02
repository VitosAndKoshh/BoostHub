using Core.Domain.Errors.UserRole;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class UserRoleEntity : EntityBase<Guid>
{
    // For EF Core
    private UserRoleEntity()
    {
    }

    private UserRoleEntity(Guid userId, Guid roleId)
    {
        UserId = userId;
        RoleId = roleId;
        GrantedAt = DateTimeOffset.UtcNow;
    }

    public Guid UserId { get; init; }
    public Guid RoleId { get; init; }
    public DateTimeOffset GrantedAt { get; init; }

    public static UserRoleEntity Create(Guid userId, Guid roleId)
    {
        if (userId == Guid.Empty)
            throw new DomainException(UserRoleErrors.InvalidUserId);

        if (roleId == Guid.Empty)
            throw new DomainException(UserRoleErrors.InvalidRoleId);

        return new UserRoleEntity(userId, roleId);
    }
}
