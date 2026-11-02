using Core.Domain.Errors.User;
using Core.Domain.Errors.UserRole;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class UserEntity : EntityBase<Guid>
{
    // For EF Core
    private UserEntity()
    {
        Email = null!;
        PasswordHash = null!;
    }

    private UserEntity(string email, string passwordHash)
    {
        Email = email;
        PasswordHash = passwordHash;   
        CreatedAt = DateTimeOffset.UtcNow;
    }
    
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public DateTimeOffset CreatedAt { get; init; }

    private readonly IList<UserRoleEntity> _roles = new List<UserRoleEntity>();
    public IReadOnlyCollection<UserRoleEntity> Roles => _roles.AsReadOnly();
    
    public static UserEntity Create(string email, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException(UserErrors.InvalidEmail);
        
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException(UserErrors.InvalidPassword);

        return new UserEntity(email.Trim(), passwordHash);
    }

    public void AddRole(Guid roleId)
    {
        if (roleId == Guid.Empty)
            throw new DomainException(UserRoleErrors.InvalidRoleId);

        if (_roles.Any(role => role.RoleId == roleId))
            throw new DomainException(UserRoleErrors.RoleAlreadyAssigned);

        _roles.Add(UserRoleEntity.Create(Id, roleId));
    }
}
