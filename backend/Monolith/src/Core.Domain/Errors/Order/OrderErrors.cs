using Core.Abstractions.Errors;

namespace Core.Domain.Errors.Order;

public static class OrderErrors
{
    public static Error InvalidOfferId =>
        new(OrderCodes.InvalidOfferId, ErrorType.Validation, "Invalid offer id");

    public static Error InvalidCustomerId =>
        new(OrderCodes.InvalidCustomerId, ErrorType.Validation, "Invalid customer id");

    public static Error InvalidBoosterId =>
        new(OrderCodes.InvalidBoosterId, ErrorType.Validation, "Invalid booster id");

    public static Error InvalidAgreedPrice =>
        new(OrderCodes.InvalidAgreedPrice, ErrorType.Validation, "Invalid agreed price");

    public static Error InvalidMaxCompletionDuration =>
        new(
            OrderCodes.InvalidMaxCompletionDuration,
            ErrorType.Validation,
            "Invalid maximum completion duration");

    public static Error InvalidStatusTransition =>
        new(OrderCodes.InvalidStatusTransition, ErrorType.Conflict, "Invalid order status transition");
}
