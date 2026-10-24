using Core.Abstractions.Errors;

namespace Core.Domain.Errors.Game;

public static class GameErrors
{
    public static Error InvalidCode =>
        new (GameCodes.InvalidCode, ErrorType.Validation, "Invalid game code");

    public static Error InvalidName =>
        new (GameCodes.InvalidName, ErrorType.Validation, "Invalid game name");
}
