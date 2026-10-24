using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Game;

public sealed class GameCodes
{
    public static readonly ErrorCode InvalidCode = new ("game.invalid-code");
    public static readonly ErrorCode InvalidName = new ("game.invalid-name");
}
