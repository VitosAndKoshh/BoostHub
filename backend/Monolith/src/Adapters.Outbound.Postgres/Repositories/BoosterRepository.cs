using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Adapters.Outbound.Postgres.Repositories;

public sealed class BoosterRepository : IBoosterRepository
{
    private readonly AppDbContext _dbContext;

    public BoosterRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<bool> ExistsByAccountIdAsync(
        Guid accountId,
        CancellationToken cancellationToken)
        => _dbContext.Boosters
            .AnyAsync(x => x.AccountId == accountId, cancellationToken);

    public async Task AddAsync(BoosterEntity booster, CancellationToken cancellationToken)
        => await _dbContext.Boosters.AddAsync(booster, cancellationToken);
}
