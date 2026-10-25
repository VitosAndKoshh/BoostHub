using Core.Domain.Enums;

namespace Core.Domain.Entities;

public sealed class RoleEntity : EntityBase<Guid>
{
    // For EF Core
    private RoleEntity(){}
    private RoleEntity(AccountRole name)
    {
        Name = name;
    }
    
    public AccountRole Name { get; private set; }

    public static RoleEntity Create(AccountRole name)
    {
        return new RoleEntity(name);
    }
}