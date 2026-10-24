using Core.Abstractions.Errors;

namespace Core.Domain.Errors.Rating;

public static class RatingErrors
{
    public static Error InvalidUnit =>
        new(RatingCodes.InvalidUnit, ErrorType.Validation, "Invalid rating unit");
}
