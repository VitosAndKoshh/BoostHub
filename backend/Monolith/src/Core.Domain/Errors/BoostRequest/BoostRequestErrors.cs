using Core.Abstractions.Errors;

namespace Core.Domain.Errors.BoostRequest;

public static class BoostRequestErrors
{
    public static Error InvalidCustomerId =>
        new(BoostRequestCodes.InvalidCustomerId, ErrorType.Validation, "Invalid customer id");

    public static Error InvalidGameId =>
        new(BoostRequestCodes.InvalidGameId, ErrorType.Validation, "Invalid game id");

    public static Error InvalidPrice =>
        new(BoostRequestCodes.InvalidPrice, ErrorType.Validation, "Invalid price");

    public static Error InvalidDescription =>
        new(BoostRequestCodes.InvalidDescription, ErrorType.Validation, "Invalid description");

    public static Error InvalidMaxCompletionDuration =>
        new(
            BoostRequestCodes.InvalidMaxCompletionDuration,
            ErrorType.Validation,
            "Invalid maximum completion duration");

    public static Error RequestAlreadyClosed =>
        new(BoostRequestCodes.RequestAlreadyClosed, ErrorType.Conflict, "Boost request is already closed");

    public static Error RequestAlreadyCancelled =>
        new(BoostRequestCodes.RequestAlreadyCancelled, ErrorType.Conflict, "Boost request is already cancelled");
}
