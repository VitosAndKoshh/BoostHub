using Core.Domain.Entities;

namespace Core.Application.Ports.Persistence.Repositories;

public interface IBoosterApplicationRepository
{
    Task AddAsync(BoosterApplicationEntity application, CancellationToken cancellationToken);
}
