using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Adapters.Outbound.Postgres.Repositories.User;

public sealed class RoleRepository : IRoleRepository
{
    private readonly AppDbContext _dbContext;
    
    public RoleRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RoleEntity?> GetByNameAsync(string name, CancellationToken cancellationToken)
        => await _dbContext.Roles
            .Where(x => x.Name.ToString() == name)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<RoleEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
        => await _dbContext.Roles
            .Where(x => x.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
}