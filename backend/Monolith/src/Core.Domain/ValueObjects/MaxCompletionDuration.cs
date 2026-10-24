using Core.Domain.Errors.BoostRequest;
using Core.Domain.Exceptions;

namespace Core.Domain.ValueObjects;

public sealed class MaxCompletionDuration : ValueObjectBase
{
    // For EF Core
    private MaxCompletionDuration() {}

    private MaxCompletionDuration(TimeSpan value)
    {
        Value = value;
    }

    public TimeSpan Value { get; private set; }

    public static MaxCompletionDuration Create(TimeSpan value)
    {
        if (value <= TimeSpan.Zero)
            throw new DomainException(BoostRequestErrors.InvalidMaxCompletionDuration);

        return new MaxCompletionDuration(value);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }
}
