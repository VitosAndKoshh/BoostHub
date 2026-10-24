using Core.Abstractions.Errors;

namespace Core.Domain.Errors.Price;

public static class PriceErrors
{
    public static Error NegativeAmount =>
        new(PriceCodes.NegativeAmount, ErrorType.Validation, "Price cannot be negative");
}
