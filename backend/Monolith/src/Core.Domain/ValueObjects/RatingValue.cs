using Core.Domain.Enums;
using Core.Domain.Errors.Rating;
using Core.Domain.Exceptions;

namespace Core.Domain.ValueObjects;

public sealed class RatingValue : ValueObjectBase
{
    // For EF Core
    private RatingValue() { }

    private RatingValue(int value, RatingUnit unit)
    {
        Value = value;
        Unit = unit;
    }

    public int Value { get; private set; }
    public RatingUnit Unit { get; private set; }

    public static RatingValue Create(int value, RatingUnit unit)
    {
        if (!Enum.IsDefined(unit))
            throw new DomainException(RatingErrors.InvalidUnit);

        return new RatingValue(value, unit);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
        yield return Unit;
    }
}
