using Core.Domain.Errors.Account;
using Core.Domain.Exceptions;
using Core.Domain.ValueObjects;

namespace Core.Domain.Entities;

public sealed class AccountIdentityEntity
{
    // For EF Core
    private AccountIdentityEntity()
    {
        IdentityProvider = null!;
        IdentityId = null!;
    }

    private AccountIdentityEntity(
        Guid accountId,
        IdentityProvider identityProvider,
        string identityId)
    {
        AccountId = accountId;
        IdentityProvider = identityProvider;
        IdentityId = identityId;       
    }
    
    public Guid AccountId { get; init; }
    public IdentityProvider IdentityProvider { get; init; }
    public string IdentityId { get; init; }

    public static AccountIdentityEntity Create(Guid accountId, IdentityProvider provider, string identityId)
    {
        if (accountId == Guid.Empty)
            throw new DomainException(AccountErrors.InvalidAccountId);

        if (string.IsNullOrWhiteSpace(identityId))
            throw new DomainException(AccountErrors.InvalidIdentityId);

        return new AccountIdentityEntity(accountId, provider, identityId);
    }
}