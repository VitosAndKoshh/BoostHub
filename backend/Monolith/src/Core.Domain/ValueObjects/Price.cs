using Core.Domain.Errors.Price;
using Core.Domain.Exceptions;

namespace Core.Domain.ValueObjects;

public sealed class Price : ValueObjectBase
{
    // For EF Core
    private Price() { }

    private Price(decimal amount)
    {
        Amount = amount;
    }

    public decimal Amount { get; private set; }

    public static Price Create(decimal amount)
    {
        if (amount < 0)
            throw new DomainException(PriceErrors.NegativeAmount);

        return new Price(amount);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Amount;
    }
}
