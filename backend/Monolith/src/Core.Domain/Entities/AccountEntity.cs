using Core.Domain.Errors.Account;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class AccountEntity : EntityBase<Guid>
{
    // For EF Core
    private AccountEntity(){}

    private AccountEntity(string? steamId)
    {
        SteamId = steamId;
        CreatedAt = DateTime.UtcNow;
    }
    
    public string? SteamId { get; private set; }
    public DateTime CreatedAt { get; init; }
    
    private readonly IList<AccountIdentityEntity> _identities = new List<AccountIdentityEntity>();
    public IReadOnlyCollection<AccountIdentityEntity> Identities => _identities.AsReadOnly();

    public static AccountEntity Create(string? steamId)
    {
        if (!string.IsNullOrEmpty(steamId) && string.IsNullOrWhiteSpace(steamId))
            throw new DomainException(AccountErrors.InvalidSteamId);
        
        return new AccountEntity(steamId);
    }
    
    public void AddIdentity(AccountIdentityEntity identity)
    {
        if (_identities.Any(i => Equals(i.IdentityProvider, identity.IdentityProvider)))
            throw new DomainException(AccountErrors.IdentityAlreadyExist);
        
        _identities.Add(identity);
    }

    public void SetSteamId(string steamId)
    {
        if (string.IsNullOrWhiteSpace(steamId))
            throw new DomainException(AccountErrors.InvalidSteamId);
        SteamId = steamId;
    }
}