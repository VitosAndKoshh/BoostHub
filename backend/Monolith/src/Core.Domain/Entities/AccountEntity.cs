using Core.Domain.Errors.Account;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class AccountEntity : EntityBase<Guid>
{

    private AccountEntity()
    {
        CreatedAt = DateTime.UtcNow;
    }
    
    public DateTime CreatedAt { get; init; }
    
    private readonly IList<AccountIdentityEntity> _identities = new List<AccountIdentityEntity>();
    public IReadOnlyCollection<AccountIdentityEntity> Identities => _identities.AsReadOnly();

    private readonly IList<GamePlatformAccountEntity> _gamePlatformAccounts = new List<GamePlatformAccountEntity>();
    public IReadOnlyCollection<GamePlatformAccountEntity> GamePlatformAccounts => _gamePlatformAccounts.AsReadOnly();

    public static AccountEntity Create()
    {
        return new AccountEntity();
    }
    
    public void AddIdentity(AccountIdentityEntity identity)
    {
        if (_identities.Any(i => Equals(i.IdentityProvider, identity.IdentityProvider)))
            throw new DomainException(AccountErrors.IdentityAlreadyExist);
        
        _identities.Add(identity);
    }

    public void AddGamePlatformAccount(GamePlatformAccountEntity gamePlatformAccount)
    {
        if (_gamePlatformAccounts.Any(gpa => Equals(gpa.Platform, gamePlatformAccount.Platform)))
            throw new DomainException(AccountErrors.GamePlatformAccountAlreadyExist);

        _gamePlatformAccounts.Add(gamePlatformAccount);
    }
}
