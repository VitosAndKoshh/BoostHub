using Core.Domain.Errors.Consumer;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class CustomerEntity : EntityBase<Guid>
{
    // For EF Core
    private CustomerEntity(){}

    private CustomerEntity(Guid accountId)
    {
        AccountId = accountId;
    }
    
    public Guid AccountId { get; init; }

    public static CustomerEntity Create(Guid accountId)
    {
        if (accountId == Guid.Empty)
            throw new DomainException(ConsumerErrors.InvalidAccountId);
        return new CustomerEntity(accountId);
    }
}