using Core.Domain.AggregateRoot;
using Core.Domain.Enums;
using Core.Domain.Errors.Booster;
using Core.Domain.Exceptions;
using Core.Domain.ValueObjects;

namespace Core.Domain.Entities;

public sealed class BoosterEntity : AggregateRootBase<Guid>
{
    // For EF Core
    private BoosterEntity()
    {
        DiscordNickname = null!;
    }

    private BoosterEntity(Guid accountId, DiscordNickname discordNickname)
    {
        AccountId = accountId;
        DiscordNickname = discordNickname;
        Status = EntityStatus.Active;
        StatusChangedAt = DateTimeOffset.UtcNow;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public Guid AccountId { get; init; }
    public DiscordNickname DiscordNickname { get; private set; }
    public EntityStatus Status { get; private set; }
    public DateTimeOffset StatusChangedAt { get; private set; }
    public DateTimeOffset CreatedAt { get; init; }
    
    public static BoosterEntity Create(Guid accountId, DiscordNickname discordNickname)
    {
        if (accountId == Guid.Empty)
            throw new DomainException(BoosterErrors.InvalidAccountId);
            
        if (discordNickname is null)
            throw new DomainException(BoosterErrors.InvalidDiscordNickname);
        
        return new BoosterEntity(accountId, discordNickname);
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
            throw new DomainException(BoosterErrors.InvalidStatusTransition);
    }
}
