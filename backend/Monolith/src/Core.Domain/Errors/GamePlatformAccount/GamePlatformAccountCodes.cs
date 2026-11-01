using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.GamePlatformAccount;

public static class GamePlatformAccountCodes
{
    public static readonly ErrorCode InvalidAccountId = new("game-platform-account.invalid-account-id");
    public static readonly ErrorCode InvalidPlatform = new("game-platform-account.invalid-platform");
    public static readonly ErrorCode InvalidPlatformUserId = new("game-platform-account.invalid-platform-user-id");
}
