using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Rating;

public sealed class RatingCodes
{
    public static readonly ErrorCode InvalidUnit = new("rating.invalid-unit");
}
