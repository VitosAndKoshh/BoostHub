using Core.Domain.Entities;

namespace Core.Application.Ports.Persistence.Repositories;

public interface IUserRepository
{
    Task<LocalCredentialEntity?> GetByEmailAsync(string email, CancellationToken cancellationToken);
    Task<bool> IsEmailExistsAsync(string email, CancellationToken cancellationToken);
    Task AddAsync(LocalCredentialEntity user, CancellationToken cancellationToken);
}