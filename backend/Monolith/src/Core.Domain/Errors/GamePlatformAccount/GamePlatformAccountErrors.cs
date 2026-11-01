using Core.Abstractions.Errors;

namespace Core.Domain.Errors.GamePlatformAccount;

public static class GamePlatformAccountErrors
{
    public static Error InvalidAccountId =>
        new(GamePlatformAccountCodes.InvalidAccountId, ErrorType.Validation, "Invalid account id");

    public static Error InvalidPlatform =>
        new(GamePlatformAccountCodes.InvalidPlatform, ErrorType.Validation, "Invalid game platform");

    public static Error InvalidPlatformUserId =>
        new(GamePlatformAccountCodes.InvalidPlatformUserId, ErrorType.Validation, "Invalid platform user id");
}
