using Core.Abstractions.Errors;

namespace Core.Domain.Errors.Booster;

public static class BoosterErrors
{
    public static Error InvalidAccountId =>
        new (BoosterCodes.InvalidAccountId, ErrorType.Validation, "Invalid account id");
    
    public static Error InvalidStatus =>
        new (BoosterCodes.InvalidStatus, ErrorType.Validation, "Invalid status");

    public static Error InvalidStatusTransition =>
        new (BoosterCodes.InvalidStatusTransition, ErrorType.Conflict, "Invalid booster status transition");
    
    public static Error InvalidDiscordNickname =>
        new (BoosterCodes.InvalidDiscordNickname, ErrorType.Validation, "Invalid discord nickname");

    public static Error AlreadyExists =>
        new (BoosterCodes.AlreadyExists, ErrorType.Conflict, "Booster already exists for account");
}
