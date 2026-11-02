using Core.Domain.Entities;

namespace Core.Application.Ports.Persistence.Repositories;

public interface IUserRepository
{
    Task<UserEntity?> GetByEmailAsync(string email, CancellationToken cancellationToken);
    Task<bool> IsEmailExistsAsync(string email, CancellationToken cancellationToken);
    Task AddAsync(UserEntity user, CancellationToken cancellationToken);
}