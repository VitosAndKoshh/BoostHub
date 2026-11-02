using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Adapters.Outbound.Postgres.Repositories;

public sealed class AccountRepository : IAccountRepository
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<AccountRepository> _logger;

    public AccountRepository(AppDbContext dbContext, ILogger<AccountRepository> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }
    
    public async Task AddAsync(AccountEntity account, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
        "Adding Account. DbContextId: {DbContextId}",
        _dbContext.ContextId.InstanceId);
        await _dbContext.Accounts.AddAsync(account, cancellationToken);
    }
}