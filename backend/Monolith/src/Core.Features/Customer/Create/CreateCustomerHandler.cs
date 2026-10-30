using Core.Application.Ports.Persistence.Repositories;
using Core.Application.Results;
using Core.Domain.Entities;

namespace Core.Features.Customer.Create;

public sealed class CreateCustomerHandler
{
    private readonly ICustomerRepository _customerRepository;

    public CreateCustomerHandler(ICustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    public async Task<Result> Handle(
        CreateCustomerCommand command,
        CancellationToken cancellationToken)
    {
        var customer = CustomerEntity.Create(command.AccountId);
        await _customerRepository.AddAsync(customer, cancellationToken);

        return Result.Success();
    }
}
