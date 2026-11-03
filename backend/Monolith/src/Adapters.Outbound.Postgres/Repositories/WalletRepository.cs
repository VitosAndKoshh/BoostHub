using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;

namespace Adapters.Outbound.Postgres.Repositories;

public sealed class WalletRepository : IWalletRepository
{
    private readonly AppDbContext _dbContext;

    public WalletRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(WalletEntity wallet, CancellationToken cancellationToken)
        => await _dbContext.Wallets.AddAsync(wallet, cancellationToken);
}