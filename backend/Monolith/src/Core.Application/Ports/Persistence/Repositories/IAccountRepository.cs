using Core.Domain.Entities;
using Core.Domain.ValueObjects;

namespace Core.Application.Ports.Persistence.Repositories;

public interface IAccountRepository
{
    Task<AccountEntity?> GetByIdentityAsync(
        IdentityProvider identityProvider,
        string identityId,
        CancellationToken cancellationToken);

    Task AddAsync(AccountEntity account, CancellationToken cancellationToken);
}
