using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;

namespace Adapters.Outbound.Postgres.Repositories;

public sealed class BoosterApplicationRepository : IBoosterApplicationRepository
{
    private readonly AppDbContext _dbContext;

    public BoosterApplicationRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(
        BoosterApplicationEntity application,
        CancellationToken cancellationToken)
        => await _dbContext.BoosterApplications.AddAsync(application, cancellationToken);
}
