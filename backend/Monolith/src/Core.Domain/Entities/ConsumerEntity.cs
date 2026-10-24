using Core.Domain.Errors.Consumer;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class ConsumerEntity : EntityBase<Guid>
{
    // For EF Core
    private ConsumerEntity(){}

    private ConsumerEntity(Guid accountId)
    {
        AccountId = accountId;
    }
    
    public Guid AccountId { get; init; }

    public ConsumerEntity Create(Guid accountId)
    {
        if (accountId == Guid.Empty)
            throw new DomainException(ConsumerErrors.InvalidAccountId);
        return new ConsumerEntity(accountId);
    }
}