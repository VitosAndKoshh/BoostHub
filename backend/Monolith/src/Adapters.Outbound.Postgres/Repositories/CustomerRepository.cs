using Adapters.Outbound.Postgres.DbContext;
using Core.Application.Ports.Persistence.Repositories;
using Core.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Adapters.Outbound.Postgres.Repositories;

public sealed class CustomerRepository : ICustomerRepository
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<CustomerRepository> _logger;

    public CustomerRepository(AppDbContext dbContext, ILogger<CustomerRepository> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task AddAsync(CustomerEntity customer, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Adding Customer. DbContextId: {DbContextId}",
            _dbContext.ContextId.InstanceId);
        await _dbContext.Customers.AddAsync(customer, cancellationToken);
    }
}
