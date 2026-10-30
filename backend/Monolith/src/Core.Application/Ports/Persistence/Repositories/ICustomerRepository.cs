using Core.Domain.Entities;

namespace Core.Application.Ports.Persistence.Repositories;

public interface ICustomerRepository
{
    Task AddAsync(CustomerEntity customer, CancellationToken cancellationToken);
}
