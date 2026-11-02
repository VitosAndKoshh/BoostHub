using Core.Domain.Enums;
using Core.Domain.Errors.Account;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class AccountEntity : EntityBase<Guid>
{

    // For EF Core
    private AccountEntity(){}

    private AccountEntity(DateTimeOffset createdAt)
    {
        Status = EntityStatus.Active;
        StatusChangedAt = DateTimeOffset.UtcNow;
        CreatedAt = createdAt;
    }

    public EntityStatus Status { get; private set; }
    public DateTimeOffset StatusChangedAt { get; private set; }
    public DateTimeOffset CreatedAt { get; init; }

    private readonly IList<AccountIdentityEntity> _identities = new List<AccountIdentityEntity>();
    public IReadOnlyCollection<AccountIdentityEntity> Identities => _identities.AsReadOnly();


    private readonly IList<GamePlatformAccountEntity> _gamePlatformAccounts = new List<GamePlatformAccountEntity>();
    public IReadOnlyCollection<GamePlatformAccountEntity> GamePlatformAccounts => _gamePlatformAccounts.AsReadOnly();

    public static AccountEntity Create()
        => new AccountEntity(DateTimeOffset.UtcNow);

    public void Deactivate()
    {
        EnsureStatus(EntityStatus.Active);
        ChangeStatus(EntityStatus.Deactivated);
    }

    public void Suspend()
    {
        EnsureStatus(EntityStatus.Active);
        ChangeStatus(EntityStatus.Suspended);
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

    public void Restore()
    {
        EnsureStatus(EntityStatus.Deactivated);
        ChangeStatus(EntityStatus.Active);
    }

    public void Unsuspend()
    {
        EnsureStatus(EntityStatus.Suspended);
        ChangeStatus(EntityStatus.Active);
    }
    
    public void AddIdentity(AccountIdentityEntity identity)
    {
        ArgumentNullException.ThrowIfNull(identity);

        if (_identities.Any(i => Equals(i.IdentityProvider, identity.IdentityProvider)))
            throw new DomainException(AccountErrors.IdentityAlreadyExist);
        
        _identities.Add(identity);
    }

    public void AddGamePlatformAccount(GamePlatformAccountEntity gamePlatformAccount)
    {
        if (_gamePlatformAccounts.Any(gpa => Equals(gpa.PlatformUserId, gamePlatformAccount.PlatformUserId)))
            throw new DomainException(AccountErrors.GamePlatformAccountAlreadyExist);

        _gamePlatformAccounts.Add(gamePlatformAccount);
    }

    private void ChangeStatus(EntityStatus status)
    {
        Status = status;
        StatusChangedAt = DateTimeOffset.UtcNow;
    }

    private void EnsureStatus(params EntityStatus[] allowedStatuses)
    {
        if (!allowedStatuses.Contains(Status))
            throw new DomainException(AccountErrors.InvalidStatusTransition);
    }
}
