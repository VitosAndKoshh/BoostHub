using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Price;

public sealed class PriceCodes
{
    public static readonly ErrorCode NegativeAmount = new("price.negative-amount");
}
