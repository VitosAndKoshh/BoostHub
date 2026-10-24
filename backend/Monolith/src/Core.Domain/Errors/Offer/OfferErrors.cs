using Core.Abstractions.Errors;

namespace Core.Domain.Errors.Offer;

public static class OfferErrors
{
    public static Error InvalidBoostRequestId =>
        new(OfferCodes.InvalidBoostRequestId, ErrorType.Validation, "Invalid boost request id");

    public static Error InvalidBoosterId =>
        new(OfferCodes.InvalidBoosterId, ErrorType.Validation, "Invalid booster id");

    public static Error InvalidPrice =>
        new(OfferCodes.InvalidPrice, ErrorType.Validation, "Invalid price");

    public static Error InvalidDescription =>
        new(OfferCodes.InvalidDescription, ErrorType.Validation, "Invalid description");

    public static Error InvalidMaxCompletionDuration =>
        new(
            OfferCodes.InvalidMaxCompletionDuration,
            ErrorType.Validation,
            "Invalid maximum completion duration");

    public static Error OfferAlreadyAccepted =>
        new(OfferCodes.OfferAlreadyAccepted, ErrorType.Conflict, "Offer is already accepted");

    public static Error OfferAlreadyRejected =>
        new(OfferCodes.OfferAlreadyRejected, ErrorType.Conflict, "Offer is already rejected");

    public static Error OfferAlreadyWithdrawn =>
        new(OfferCodes.OfferAlreadyWithdrawn, ErrorType.Conflict, "Offer is already withdrawn");
}
