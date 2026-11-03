using Core.Domain.Entities;

namespace Core.Application.Ports.Persistence.Repositories;

public interface IWalletRepository
{
    Task AddAsync(WalletEntity wallet, CancellationToken cancellationToken);
}