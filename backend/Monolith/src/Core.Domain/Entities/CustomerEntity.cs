using Core.Domain.Enums;
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
        Status = EntityStatus.Active;
        StatusChangedAt = DateTimeOffset.UtcNow;
        CreatedAt = DateTimeOffset.UtcNow;
    }
    
    public Guid AccountId { get; init; }
    public EntityStatus Status { get; private set; }
    public DateTimeOffset StatusChangedAt { get; private set; }
    public DateTimeOffset CreatedAt { get; init; }

    public static CustomerEntity Create(Guid accountId)
    {
        if (accountId == Guid.Empty)
            throw new DomainException(ConsumerErrors.InvalidAccountId);
        return new CustomerEntity(accountId);
    }

    public void Suspend()
    {
        EnsureStatus(EntityStatus.Active);
        ChangeStatus(EntityStatus.Suspended);
    }

    public void Unsuspend()
    {
        EnsureStatus(EntityStatus.Suspended);
        ChangeStatus(EntityStatus.Active);
    }

    public void Ban()
    {
        EnsureStatus(EntityStatus.Active);
        ChangeStatus(EntityStatus.Banned);
    }

    public void Unban()
    {
        EnsureStatus(EntityStatus.Banned);
        ChangeStatus(EntityStatus.Active);
    }

    public void Deactivate()
    {
        EnsureStatus(EntityStatus.Active);
        ChangeStatus(EntityStatus.Deactivated);
    }

    public void Restore()
    {
        EnsureStatus(EntityStatus.Deactivated);
        ChangeStatus(EntityStatus.Active);
    }

    private void ChangeStatus(EntityStatus status)
    {
        Status = status;
        StatusChangedAt = DateTimeOffset.UtcNow;
    }

    private void EnsureStatus(EntityStatus allowedStatus)
    {
        if (Status != allowedStatus)
            throw new DomainException(ConsumerErrors.InvalidStatusTransition);
    }
}
