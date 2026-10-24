using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Booster;

public sealed class BoosterCodes
{
    public static readonly ErrorCode InvalidAccountId = new ("booster.invalid-account-id");
    public static readonly ErrorCode InvalidStatus = new ("booster.invalid-status");
    public static readonly ErrorCode InvalidDiscordNickname = new ("booster.invalid-discord-nickname");
}