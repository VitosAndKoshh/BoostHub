using Core.Domain.Entities;

namespace Core.Application.Ports.Persistence.Repositories;

public interface IAccountRepository
{
    Task AddAsync(AccountEntity account, CancellationToken cancellationToken);
}