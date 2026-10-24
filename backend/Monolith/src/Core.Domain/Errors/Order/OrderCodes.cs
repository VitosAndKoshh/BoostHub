using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Order;

public sealed class OrderCodes
{
    public static readonly ErrorCode InvalidOfferId = new("order.invalid-offer-id");
    public static readonly ErrorCode InvalidCustomerId = new("order.invalid-customer-id");
    public static readonly ErrorCode InvalidBoosterId = new("order.invalid-booster-id");
    public static readonly ErrorCode InvalidAgreedPrice = new("order.invalid-agreed-price");
    public static readonly ErrorCode InvalidMaxCompletionDuration = new("order.invalid-max-completion-duration");
    public static readonly ErrorCode InvalidStatusTransition = new("order.invalid-status-transition");
}
