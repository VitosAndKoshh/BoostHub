using Core.Domain.Entities;

namespace Core.Application.Ports.Persistence.Repositories;

public interface IBoosterRepository
{
    Task<bool> ExistsByAccountIdAsync(Guid accountId, CancellationToken cancellationToken);
    Task AddAsync(BoosterEntity booster, CancellationToken cancellationToken);
}
