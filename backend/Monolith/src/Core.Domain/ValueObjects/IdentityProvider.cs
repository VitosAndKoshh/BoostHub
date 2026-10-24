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
    public static readonly IdentityProvider Google = new("Google");

    public static IdentityProvider From(string provider)
    {
        if (string.Equals(provider, Local.Provider, StringComparison.OrdinalIgnoreCase))
            return Local;

        if (string.Equals(provider, Google.Provider, StringComparison.OrdinalIgnoreCase))
            return Google;

        throw new DomainException(AccountErrors.InvalidIdentityProvider);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Provider;
    }
}