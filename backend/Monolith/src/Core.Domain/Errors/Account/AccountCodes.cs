using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Account;

public sealed class AccountCodes
{
    public static readonly ErrorCode InvalidIdentityId = new ("account.invalid-identity-id");
    public static readonly ErrorCode InvalidSteamId = new ("account.invalid-steam-id");
    public static readonly ErrorCode InvalidAccountId = new ("account.invalid-account-id");
    public static readonly ErrorCode IdentityAlreadyExist = new ("account.identity-already-exist");
    public static readonly ErrorCode InvalidIdentityProvider = new ("account.invalid-identity-provider");
}