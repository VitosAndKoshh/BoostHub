using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;

namespace Adapters.Outbound.Postgres.Repositories;

public sealed class CustomerRepository : ICustomerRepository
{
    private readonly AppDbContext _dbContext;

    public CustomerRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(CustomerEntity customer, CancellationToken cancellationToken)
        => await _dbContext.Customers.AddAsync(customer, cancellationToken);
}
