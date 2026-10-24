using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Offer;

public sealed class OfferCodes
{
    public static readonly ErrorCode InvalidBoostRequestId = new("offer.invalid-boost-request-id");
    public static readonly ErrorCode InvalidBoosterId = new("offer.invalid-booster-id");
    public static readonly ErrorCode InvalidPrice = new("offer.invalid-price");
    public static readonly ErrorCode InvalidDescription = new("offer.invalid-description");
    public static readonly ErrorCode InvalidMaxCompletionDuration = new("offer.invalid-max-completion-duration");
    public static readonly ErrorCode OfferAlreadyAccepted = new("offer.already-accepted");
    public static readonly ErrorCode OfferAlreadyRejected = new("offer.already-rejected");
    public static readonly ErrorCode OfferAlreadyWithdrawn = new("offer.already-withdrawn");
}
