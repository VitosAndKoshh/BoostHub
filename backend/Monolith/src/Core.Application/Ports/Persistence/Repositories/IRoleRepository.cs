using Core.Domain.Entities;

namespace Core.Application.Ports.Persistence.Repositories;

public interface IRoleRepository
{
    Task<RoleEntity?> GetByNameAsync(string name, CancellationToken cancellationToken);
    Task<RoleEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}