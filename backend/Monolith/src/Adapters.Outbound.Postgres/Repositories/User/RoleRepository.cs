using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;
using Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Adapters.Outbound.Postgres.Repositories.User;

public sealed class RoleRepository : IRoleRepository
{
    private readonly AppDbContext _dbContext;
    
    public RoleRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RoleEntity?> GetByNameAsync(AccountRole name, CancellationToken cancellationToken)
        => await _dbContext.Roles
            .FirstOrDefaultAsync(x => x.Name == name, cancellationToken);

    public async Task<RoleEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
        => await _dbContext.Roles
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<List<AccountRole>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken)
        => await _dbContext.Roles
            .AsNoTracking()
            .Where(role => _dbContext.UserRoles
                .Any(userRole =>
                    userRole.UserId == userId &&
                    userRole.RoleId == role.Id))
            .Select(x => x.Name)
            .ToListAsync(cancellationToken);
}