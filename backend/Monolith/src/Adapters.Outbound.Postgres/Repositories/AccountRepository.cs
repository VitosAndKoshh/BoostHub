using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;

namespace Adapters.Outbound.Postgres.Repositories;

public sealed class AccountRepository : IAccountRepository
{
    private readonly AppDbContext _dbContext;

    public AccountRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task AddAsync(AccountEntity account, CancellationToken cancellationToken)
        => await _dbContext.Accounts.AddAsync(account, cancellationToken);
}