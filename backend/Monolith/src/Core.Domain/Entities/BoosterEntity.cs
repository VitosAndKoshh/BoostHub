using Core.Domain.AggregateRoot;
using Core.Domain.Enums;
using Core.Domain.Errors.Booster;
using Core.Domain.Exceptions;
using Core.Domain.ValueObjects;

namespace Core.Domain.Entities;

public sealed class BoosterEntity : AggregateRootBase<Guid>
{
    // For EF Core
    private BoosterEntity(){}

    private BoosterEntity(Guid accountId, DiscordNickname discordNickname)
    {
        AccountId = accountId;
        DiscordNickname = discordNickname;
        Status = BoosterStatus.Pending;       
    }

    public Guid AccountId { get; init; }
    public DiscordNickname DiscordNickname { get; private set; }
    public BoosterStatus Status { get; private set; }   
    
    public BoosterEntity Create(Guid accountId, DiscordNickname discordNickname)
    {
        if (accountId == Guid.Empty)
            throw new DomainException(BoosterErrors.InvalidAccountId);
            
        return new BoosterEntity(accountId, discordNickname);
    }
    
    public void SetStatus(BoosterStatus status)
        => Status = status;
}