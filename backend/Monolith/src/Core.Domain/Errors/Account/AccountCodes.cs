using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Account;

public sealed class AccountCodes
{
    public static readonly ErrorCode InvalidIdentityId = new ("account.invalid-identity-id");
    public static readonly ErrorCode InvalidSteamId = new ("account.invalid-steam-id");
    public static readonly ErrorCode InvalidAccountId = new ("account.invalid-account-id");
    public static readonly ErrorCode IdentityAlreadyExist = new ("account.identity-already-exist");
    public static readonly ErrorCode GamePlatformAccountAlreadyExist = new ("account.game-platform-account-already-exist");
    public static readonly ErrorCode InvalidStatusTransition = new ("account.invalid-status-transition");
    public static readonly ErrorCode InvalidIdentityProvider = new ("account.invalid-identity-provider");
    public static readonly ErrorCode NotFound = new ("account.not-found");
    public static readonly ErrorCode NotActive = new ("account.not-active");
}
