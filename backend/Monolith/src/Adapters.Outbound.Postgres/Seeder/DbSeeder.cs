using Adapters.Outbound.Postgres.DbContext;
using Core.Domain.Entities;
using Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Adapters.Outbound.Postgres.Seeder;

public sealed class DbSeeder
{
    private readonly AppDbContext _dbContext;
    
    public DbSeeder(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        var isNotEmpty = await _dbContext.Roles.AnyAsync(cancellationToken);
        if (isNotEmpty) return;
        List<RoleEntity> roles =
        [
            RoleEntity.Create(AccountRole.Consumer),
            RoleEntity.Create(AccountRole.Booster),
            RoleEntity.Create(AccountRole.Admin)
        ];
        await _dbContext.Roles.AddRangeAsync(roles, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}