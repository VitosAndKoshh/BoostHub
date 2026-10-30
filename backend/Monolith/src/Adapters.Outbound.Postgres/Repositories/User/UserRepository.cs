using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Adapters.Outbound.Postgres.Repositories.User;

public sealed class UserRepository : IUserRepository
{
    private readonly AppDbContext _dbContext;
    
    public UserRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<LocalCredentialEntity?> GetByEmailAsync(string email, CancellationToken cancellationToken)
        => await _dbContext.LocalCredentials
            .Where(x => x.Email == email)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<bool> IsEmailExistsAsync(string email, CancellationToken cancellationToken)
        => await _dbContext.LocalCredentials.AnyAsync(x => x.Email == email, cancellationToken);

    public async Task AddAsync(LocalCredentialEntity user, CancellationToken cancellationToken)
        => await _dbContext.LocalCredentials.AddAsync(user, cancellationToken);
}