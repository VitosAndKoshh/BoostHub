using Core.Domain.Entities;
using Core.Domain.Enums;

namespace Core.Application.Ports.Persistence.Repositories;

public interface IRoleRepository
{
    Task<RoleEntity?> GetByNameAsync(AccountRole name, CancellationToken cancellationToken);
    Task<RoleEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<List<AccountRole>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    
}