using Core.Domain.Errors.Account;
using Core.Domain.Exceptions;

namespace Core.Domain.ValueObjects;

public sealed class IdentityProvider : ValueObjectBase
{
    public string Provider { get; }
    
    // For Ef Core
    private IdentityProvider(){}

    private IdentityProvider(string provider) => Provider = provider;

    public static readonly IdentityProvider Local = new("Local");

    public static IdentityProvider From(string provider)
    {
        if (string.Equals(provider, Local.Provider, StringComparison.OrdinalIgnoreCase))
            return Local;

        throw new DomainException(AccountErrors.InvalidIdentityProvider);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Provider;
    }
}