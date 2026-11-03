using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;
using Core.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Adapters.Outbound.Postgres.Repositories;

public sealed class AccountRepository : IAccountRepository
{
    private readonly AppDbContext _dbContext;

    public AccountRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AccountEntity?> GetByIdentityAsync(
        IdentityProvider identityProvider,
        string identityId,
        CancellationToken cancellationToken)
        => await _dbContext.Accounts
            .FirstOrDefaultAsync(
                account => account.Identities.Any(identity =>
                    identity.IdentityId == identityId &&
                    identity.IdentityProvider == identityProvider),
                cancellationToken);

    public async Task AddAsync(AccountEntity account, CancellationToken cancellationToken)
        => await _dbContext.Accounts.AddAsync(account, cancellationToken);
}
